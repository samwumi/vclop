import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, FormField, FormFieldType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ResourceNotFoundException, ValidationFailedException } from '../../common/exceptions/app.exceptions';
import { SubmitFormDto } from './dto/submit-form.dto';

interface FieldValidationError {
  field: string;
  message: string;
}

@Injectable()
export class FormSubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * Validates incoming values against the live field definitions (required,
   * type shape, and any per-field `validation` rules), then upserts a single
   * FormSubmission for this (formTemplateId, entityType, entityId) so
   * re-submitting the same form (e.g. "save and continue") updates in place
   * rather than creating duplicates.
   */
  async submit(dto: SubmitFormDto, actorId: string): Promise<unknown> {
    const template = await this.prisma.formTemplate.findFirst({
      where: { id: dto.formTemplateId, deletedAt: null, isActive: true },
      include: { sections: { include: { fields: { where: { isActive: true } } } } },
    });
    if (!template) throw new ResourceNotFoundException('Form template', dto.formTemplateId);

    if (template.entityType !== dto.entityType) {
      throw new BusinessException(
        `Template "${template.code}" is configured for ${template.entityType}, not ${dto.entityType}`,
      );
    }

    const fields = template.sections.flatMap((s) => s.fields);
    const fieldsById = new Map(fields.map((f) => [f.id, f]));

    const errors = this.validateValues(dto.values, fieldsById, fields);
    if (errors.length > 0) throw new ValidationFailedException(errors);

    const submission = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.formSubmission.findFirst({
        where: { formTemplateId: dto.formTemplateId, entityType: dto.entityType, entityId: dto.entityId },
      });

      const record = existing
        ? await tx.formSubmission.update({
            where: { id: existing.id },
            data: { submittedById: actorId, submittedAt: new Date(), isComplete: this.isComplete(dto.values, fields) },
          })
        : await tx.formSubmission.create({
            data: {
              formTemplateId: dto.formTemplateId,
              entityType: dto.entityType,
              entityId: dto.entityId,
              submittedById: actorId,
              isComplete: this.isComplete(dto.values, fields),
            },
          });

      await Promise.all(
        dto.values.map((v) =>
          tx.formFieldValue.upsert({
            where: { submissionId_fieldId: { submissionId: record.id, fieldId: v.fieldId } },
            create: { submissionId: record.id, fieldId: v.fieldId, value: v.value as never },
            update: { value: v.value as never },
          }),
        ),
      );

      return record;
    });

    this.events.emit('audit.log', {
      userId: actorId,
      action: AuditAction.CREATE,
      module: 'forms',
      entityId: submission.id,
      entityType: 'FormSubmission',
      description: `Submitted "${template.name}" for ${dto.entityType} ${dto.entityId}`,
      isSuccess: true,
    });

    return this.findForEntity(dto.formTemplateId, dto.entityType, dto.entityId);
  }

  /** Returns the submission with values resolved by field code, ready for a form renderer to pre-fill. */
  async findForEntity(formTemplateId: string, entityType: string, entityId: string): Promise<unknown> {
    const submission = await this.prisma.formSubmission.findFirst({
      where: { formTemplateId, entityType: entityType as never, entityId },
      include: { values: { include: { field: true } } },
    });
    if (!submission) return null;

    const valuesByCode: Record<string, unknown> = {};
    for (const v of submission.values) {
      valuesByCode[v.field.code] = v.value;
    }

    return {
      id: submission.id,
      formTemplateId: submission.formTemplateId,
      entityType: submission.entityType,
      entityId: submission.entityId,
      isComplete: submission.isComplete,
      submittedAt: submission.submittedAt,
      values: valuesByCode,
    };
  }

  // ── Validation ───────────────────────────────────────────────────────────

  private validateValues(
    values: SubmitFormDto['values'],
    fieldsById: Map<string, FormField>,
    allFields: FormField[],
  ): FieldValidationError[] {
    const errors: FieldValidationError[] = [];
    const submittedIds = new Set(values.map((v) => v.fieldId));

    for (const v of values) {
      const field = fieldsById.get(v.fieldId);
      if (!field) {
        errors.push({ field: v.fieldId, message: 'Field does not belong to this form template (or is inactive)' });
        continue;
      }
      errors.push(...this.validateSingleValue(field, v.value));
    }

    // Required fields that were never submitted at all (visibility rules are
    // evaluated client-side/at review time, so this only flags hard misses).
    for (const field of allFields) {
      if (field.isRequired && field.type !== FormFieldType.HIDDEN && !submittedIds.has(field.id)) {
        errors.push({ field: field.code, message: `${field.label} is required` });
      }
    }

    return errors;
  }

  private validateSingleValue(field: FormField, value: unknown): FieldValidationError[] {
    const errors: FieldValidationError[] = [];
    const isEmpty = value === null || value === undefined || value === '';

    if (field.isRequired && isEmpty) {
      errors.push({ field: field.code, message: `${field.label} is required` });
      return errors;
    }
    if (isEmpty) return errors;

    switch (field.type) {
      case FormFieldType.NUMBER:
      case FormFieldType.MONEY:
        if (typeof value !== 'number' && Number.isNaN(Number(value))) {
          errors.push({ field: field.code, message: `${field.label} must be a number` });
        }
        break;
      case FormFieldType.BVN:
        if (!/^\d{11}$/.test(String(value))) {
          errors.push({ field: field.code, message: `${field.label} must be 11 digits` });
        }
        break;
      case FormFieldType.NIN:
        if (!/^\d{11}$/.test(String(value))) {
          errors.push({ field: field.code, message: `${field.label} must be 11 digits` });
        }
        break;
      case FormFieldType.EMAIL:
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
          errors.push({ field: field.code, message: `${field.label} must be a valid email` });
        }
        break;
      case FormFieldType.PHONE:
        if (!/^\+?\d{10,14}$/.test(String(value))) {
          errors.push({ field: field.code, message: `${field.label} must be a valid phone number` });
        }
        break;
      case FormFieldType.DROPDOWN:
      case FormFieldType.RADIO: {
        const options = (field.options as Array<{ value: string }> | null) ?? [];
        if (options.length > 0 && !options.some((o) => o.value === value)) {
          errors.push({ field: field.code, message: `${field.label} has an invalid selection` });
        }
        break;
      }
      case FormFieldType.MULTI_SELECT: {
        const options = (field.options as Array<{ value: string }> | null) ?? [];
        if (!Array.isArray(value)) {
          errors.push({ field: field.code, message: `${field.label} must be a list of selections` });
        } else if (options.length > 0 && value.some((v) => !options.some((o) => o.value === v))) {
          errors.push({ field: field.code, message: `${field.label} contains an invalid selection` });
        }
        break;
      }
      case FormFieldType.GPS: {
        const gps = value as { lat?: number; lng?: number };
        if (typeof gps?.lat !== 'number' || typeof gps?.lng !== 'number') {
          errors.push({ field: field.code, message: `${field.label} must include lat/lng coordinates` });
        }
        break;
      }
      default:
        break;
    }

    const rules = (field.validation as Record<string, unknown> | null) ?? {};
    if (typeof value === 'string') {
      if (typeof rules.minLength === 'number' && value.length < rules.minLength) {
        errors.push({ field: field.code, message: `${field.label} must be at least ${rules.minLength} characters` });
      }
      if (typeof rules.maxLength === 'number' && value.length > rules.maxLength) {
        errors.push({ field: field.code, message: `${field.label} must be at most ${rules.maxLength} characters` });
      }
      if (typeof rules.regex === 'string' && !new RegExp(rules.regex).test(value)) {
        errors.push({ field: field.code, message: `${field.label} is not in the expected format` });
      }
    }
    if (typeof value === 'number' || typeof value === 'string') {
      const num = Number(value);
      if (typeof rules.min === 'number' && num < rules.min) {
        errors.push({ field: field.code, message: `${field.label} must be at least ${rules.min}` });
      }
      if (typeof rules.max === 'number' && num > rules.max) {
        errors.push({ field: field.code, message: `${field.label} must be at most ${rules.max}` });
      }
    }

    return errors;
  }

  private isComplete(values: SubmitFormDto['values'], fields: FormField[]): boolean {
    const submittedIds = new Set(values.filter((v) => v.value !== null && v.value !== undefined && v.value !== '').map((v) => v.fieldId));
    return fields
      .filter((f) => f.isRequired && f.type !== FormFieldType.HIDDEN)
      .every((f) => submittedIds.has(f.id));
  }
}
