import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, FormEntityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/utils/pagination.util';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import {
  BusinessException,
  ResourceAlreadyExistsException,
  ResourceNotFoundException,
} from '../../common/exceptions/app.exceptions';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { CreateFormSectionDto, ReorderSectionsDto, UpdateFormSectionDto } from './dto/form-section.dto';
import { CreateFormFieldDto, MoveFieldsDto, UpdateFormFieldDto } from './dto/form-field.dto';

const TEMPLATE_INCLUDE = {
  sections: {
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' as const },
    include: {
      fields: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' as const },
      },
    },
  },
};

@Injectable()
export class FormTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  // ── Templates ────────────────────────────────────────────────────────────

  async findAll(query: PaginationDto & { entityType?: FormEntityType; withInactive?: boolean }): Promise<PaginatedResult<unknown>> {
    const where = {
      deletedAt: null,
      ...(query.entityType && { entityType: query.entityType }),
      ...(!query.withInactive && { isActive: true }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search } },
          { code: { contains: query.search } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.formTemplate.findMany({
        where,
        include: { _count: { select: { sections: true, submissions: true } } },
        orderBy: [{ entityType: 'asc' }, { name: 'asc' }],
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.formTemplate.count({ where }),
    ]);

    return paginate(data, total, query.page ?? 1, query.limit ?? 25);
  }

  /** Full template with sections/fields, ready for a frontend renderer to consume directly. */
  async findOne(id: string): Promise<unknown> {
    const template = await this.prisma.formTemplate.findFirst({
      where: { id, deletedAt: null },
      include: TEMPLATE_INCLUDE,
    });
    if (!template) throw new ResourceNotFoundException('Form template', id);
    return template;
  }

  async findDefaultForEntityType(entityType: FormEntityType): Promise<unknown> {
    const template = await this.prisma.formTemplate.findFirst({
      where: { entityType, isDefault: true, isActive: true, deletedAt: null },
      include: TEMPLATE_INCLUDE,
    });
    if (!template) {
      throw new ResourceNotFoundException(`Default ${entityType} form template`);
    }
    return template;
  }

  async create(dto: CreateFormTemplateDto, actorId: string): Promise<unknown> {
    const existing = await this.prisma.formTemplate.findFirst({
      where: { code: dto.code, deletedAt: null },
    });
    if (existing) throw new ResourceAlreadyExistsException('Form template', 'code', dto.code);

    if (dto.isDefault) {
      await this.clearExistingDefault(dto.entityType);
    }

    const template = await this.prisma.formTemplate.create({
      data: {
        entityType: dto.entityType,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault ?? false,
        createdById: actorId,
        updatedById: actorId,
      },
    });

    this.emitAudit(AuditAction.CREATE, actorId, template.id, `Created form template ${template.code}`);
    return this.findOne(template.id);
  }

  async update(id: string, dto: UpdateFormTemplateDto, actorId: string): Promise<unknown> {
    await this.assertTemplateExists(id);

    if (dto.isDefault) {
      const template = await this.prisma.formTemplate.findUniqueOrThrow({ where: { id } });
      await this.clearExistingDefault(template.entityType, id);
    }

    const updated = await this.prisma.formTemplate.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        updatedById: actorId,
      },
    });

    this.emitAudit(AuditAction.UPDATE, actorId, id, `Updated form template ${updated.code}`, dto);
    return this.findOne(id);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const template = await this.assertTemplateExists(id);

    const submissionCount = await this.prisma.formSubmission.count({ where: { formTemplateId: id } });
    if (submissionCount > 0) {
      throw new BusinessException(
        `Cannot delete — ${submissionCount} submission(s) already reference this template. Deactivate it instead.`,
      );
    }

    await this.prisma.formTemplate.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.emitAudit(AuditAction.DELETE, actorId, id, `Deleted form template ${template.code}`);
  }

  /** Bump the version and duplicate the whole section/field tree — used when a template needs breaking changes without touching historical submissions. */
  async clone(id: string, newCode: string, actorId: string): Promise<unknown> {
    const source = await this.prisma.formTemplate.findFirst({
      where: { id, deletedAt: null },
      include: TEMPLATE_INCLUDE,
    });
    if (!source) throw new ResourceNotFoundException('Form template', id);

    const existing = await this.prisma.formTemplate.findFirst({ where: { code: newCode, deletedAt: null } });
    if (existing) throw new ResourceAlreadyExistsException('Form template', 'code', newCode);

    const clone = await this.prisma.formTemplate.create({
      data: {
        entityType: source.entityType,
        code: newCode,
        name: `${source.name} (copy)`,
        description: source.description,
        version: source.version + 1,
        createdById: actorId,
        updatedById: actorId,
        sections: {
          create: source.sections.map((section) => ({
            title: section.title,
            description: section.description,
            sortOrder: section.sortOrder,
            fields: {
              create: section.fields.map((field) => ({
                code: field.code,
                label: field.label,
                type: field.type,
                placeholder: field.placeholder,
                helpText: field.helpText,
                isRequired: field.isRequired,
                defaultValue: field.defaultValue !== undefined && field.defaultValue !== null ? JSON.stringify(field.defaultValue) : undefined,
                options: field.options !== undefined && field.options !== null ? JSON.stringify(field.options) : undefined,
                validation: field.validation !== undefined && field.validation !== null ? JSON.stringify(field.validation) : undefined,
                visibilityRule: field.visibilityRule !== undefined && field.visibilityRule !== null ? JSON.stringify(field.visibilityRule) : undefined,
                sortOrder: field.sortOrder,
              })),
            },
          })),
        },
      },
    });

    this.emitAudit(AuditAction.CREATE, actorId, clone.id, `Cloned form template ${source.code} -> ${newCode}`);
    return this.findOne(clone.id);
  }

  // ── Sections ─────────────────────────────────────────────────────────────

  async addSection(templateId: string, dto: CreateFormSectionDto, actorId: string): Promise<unknown> {
    await this.assertTemplateExists(templateId);

    const sortOrder = dto.sortOrder ?? (await this.nextSectionSortOrder(templateId));

    const section = await this.prisma.formSection.create({
      data: {
        formTemplateId: templateId,
        title: dto.title,
        description: dto.description,
        sortOrder,
      },
    });

    this.emitAudit(AuditAction.CREATE, actorId, templateId, `Added section "${section.title}"`);
    return this.findOne(templateId);
  }

  async updateSection(templateId: string, sectionId: string, dto: UpdateFormSectionDto, actorId: string): Promise<unknown> {
    await this.assertSectionExists(templateId, sectionId);

    await this.prisma.formSection.update({
      where: { id: sectionId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.emitAudit(AuditAction.UPDATE, actorId, sectionId, 'Updated form section', dto);
    return this.findOne(templateId);
  }

  async removeSection(templateId: string, sectionId: string, actorId: string): Promise<unknown> {
    await this.assertSectionExists(templateId, sectionId);

    // Soft-remove: deactivate rather than hard-delete, so historical
    // submissions that reference its fields keep resolving correctly.
    await this.prisma.formSection.update({ where: { id: sectionId }, data: { isActive: false } });

    this.emitAudit(AuditAction.DELETE, actorId, sectionId, 'Removed form section');
    return this.findOne(templateId);
  }

  async reorderSections(templateId: string, dto: ReorderSectionsDto, actorId: string): Promise<unknown> {
    await this.assertTemplateExists(templateId);

    await this.prisma.$transaction(
      dto.sections.map((item) =>
        this.prisma.formSection.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    this.emitAudit(AuditAction.UPDATE, actorId, templateId, 'Reordered form sections');
    return this.findOne(templateId);
  }

  // ── Fields ───────────────────────────────────────────────────────────────

  async addField(templateId: string, sectionId: string, dto: CreateFormFieldDto, actorId: string): Promise<unknown> {
    await this.assertSectionExists(templateId, sectionId);

    const existing = await this.prisma.formField.findFirst({ where: { sectionId, code: dto.code } });
    if (existing) throw new ResourceAlreadyExistsException('Form field', 'code', dto.code);

    const sortOrder = dto.sortOrder ?? (await this.nextFieldSortOrder(sectionId));

    const field = await this.prisma.formField.create({
      data: {
        sectionId,
        code: dto.code,
        label: dto.label,
        type: dto.type,
        placeholder: dto.placeholder,
        helpText: dto.helpText,
        isRequired: dto.isRequired ?? false,
        defaultValue: dto.defaultValue !== undefined ? JSON.stringify(dto.defaultValue) : undefined,
        options: dto.options !== undefined ? JSON.stringify(dto.options) : undefined,
        validation: dto.validation !== undefined ? JSON.stringify(dto.validation) : undefined,
        visibilityRule: dto.visibilityRule !== undefined ? JSON.stringify(dto.visibilityRule) : undefined,
        sortOrder,
      },
    });

    this.emitAudit(AuditAction.CREATE, actorId, field.id, `Added field "${field.label}" (${field.code})`);
    return this.findOne(templateId);
  }

  async updateField(templateId: string, fieldId: string, dto: UpdateFormFieldDto, actorId: string): Promise<unknown> {
    const field = await this.assertFieldExists(templateId, fieldId);

    if (dto.code && dto.code !== field.code) {
      const existing = await this.prisma.formField.findFirst({ where: { sectionId: field.sectionId, code: dto.code } });
      if (existing) throw new ResourceAlreadyExistsException('Form field', 'code', dto.code);
    }

    await this.prisma.formField.update({
      where: { id: fieldId },
      data: {
        ...(dto.code && { code: dto.code }),
        ...(dto.label && { label: dto.label }),
        ...(dto.type && { type: dto.type }),
        ...(dto.placeholder !== undefined && { placeholder: dto.placeholder }),
        ...(dto.helpText !== undefined && { helpText: dto.helpText }),
        ...(dto.isRequired !== undefined && { isRequired: dto.isRequired }),
        ...(dto.defaultValue !== undefined && { defaultValue: JSON.stringify(dto.defaultValue) }),
        ...(dto.options !== undefined && { options: JSON.stringify(dto.options) }),
        ...(dto.validation !== undefined && { validation: JSON.stringify(dto.validation) }),
        ...(dto.visibilityRule !== undefined && { visibilityRule: JSON.stringify(dto.visibilityRule) }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.emitAudit(AuditAction.UPDATE, actorId, fieldId, `Updated field ${field.code}`, dto);
    return this.findOne(templateId);
  }

  async removeField(templateId: string, fieldId: string, actorId: string): Promise<unknown> {
    const field = await this.assertFieldExists(templateId, fieldId);

    // Soft-remove so FormFieldValue rows on historical submissions stay valid.
    await this.prisma.formField.update({ where: { id: fieldId }, data: { isActive: false } });

    this.emitAudit(AuditAction.DELETE, actorId, fieldId, `Removed field ${field.code}`);
    return this.findOne(templateId);
  }

  /** Move fields between sections and/or change their order in one shot (drag-and-drop from the admin UI). */
  async moveFields(templateId: string, dto: MoveFieldsDto, actorId: string): Promise<unknown> {
    await this.assertTemplateExists(templateId);

    await this.prisma.$transaction(
      dto.fields.map((item) =>
        this.prisma.formField.update({
          where: { id: item.id },
          data: {
            sortOrder: item.sortOrder,
            ...(item.sectionId && { sectionId: item.sectionId }),
          },
        }),
      ),
    );

    this.emitAudit(AuditAction.UPDATE, actorId, templateId, 'Moved/reordered form fields');
    return this.findOne(templateId);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async clearExistingDefault(entityType: FormEntityType, excludeId?: string): Promise<void> {
    await this.prisma.formTemplate.updateMany({
      where: { entityType, isDefault: true, deletedAt: null, ...(excludeId && { NOT: { id: excludeId } }) },
      data: { isDefault: false },
    });
  }

  private async nextSectionSortOrder(templateId: string): Promise<number> {
    const last = await this.prisma.formSection.findFirst({
      where: { formTemplateId: templateId },
      orderBy: { sortOrder: 'desc' },
    });
    return (last?.sortOrder ?? -1) + 1;
  }

  private async nextFieldSortOrder(sectionId: string): Promise<number> {
    const last = await this.prisma.formField.findFirst({
      where: { sectionId },
      orderBy: { sortOrder: 'desc' },
    });
    return (last?.sortOrder ?? -1) + 1;
  }

  private async assertTemplateExists(id: string) {
    const template = await this.prisma.formTemplate.findFirst({ where: { id, deletedAt: null } });
    if (!template) throw new ResourceNotFoundException('Form template', id);
    return template;
  }

  private async assertSectionExists(templateId: string, sectionId: string) {
    const section = await this.prisma.formSection.findFirst({ where: { id: sectionId, formTemplateId: templateId } });
    if (!section) throw new ResourceNotFoundException('Form section', sectionId);
    return section;
  }

  private async assertFieldExists(templateId: string, fieldId: string) {
    const field = await this.prisma.formField.findFirst({
      where: { id: fieldId, section: { formTemplateId: templateId } },
    });
    if (!field) throw new ResourceNotFoundException('Form field', fieldId);
    return field;
  }

  private emitAudit(action: AuditAction, userId: string, entityId: string, description: string, newValues?: unknown) {
    this.events.emit('audit.log', {
      userId,
      action,
      module: 'forms',
      entityId,
      entityType: 'FormTemplate',
      description,
      newValues,
      isSuccess: true,
    });
  }
}
