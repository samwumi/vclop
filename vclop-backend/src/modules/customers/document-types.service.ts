import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, CustomerType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ResourceAlreadyExistsException, ResourceNotFoundException } from '../../common/exceptions/app.exceptions';
import { CreateDocumentTypeDto, UpdateDocumentTypeDto } from './dto/document-type.dto';

@Injectable()
export class DocumentTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async findAll(appliesTo?: CustomerType, withInactive = false): Promise<unknown[]> {
    return this.prisma.documentType.findMany({
      where: {
        deletedAt: null,
        ...(!withInactive && { isActive: true }),
        ...(appliesTo && { OR: [{ appliesTo }, { appliesTo: null }] }),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string): Promise<unknown> {
    const type = await this.assertExists(id);
    return type;
  }

  async create(dto: CreateDocumentTypeDto, actorId: string): Promise<unknown> {
    const existing = await this.prisma.documentType.findFirst({ where: { code: dto.code, deletedAt: null } });
    if (existing) throw new ResourceAlreadyExistsException('Document type', 'code', dto.code);

    const type = await this.prisma.documentType.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        appliesTo: dto.appliesTo,
        isRequiredDefault: dto.isRequiredDefault ?? false,
        expiryApplicable: dto.expiryApplicable ?? false,
      },
    });

    this.emitAudit(AuditAction.CREATE, actorId, type.id, `Created document type ${type.code}`);
    return type;
  }

  async update(id: string, dto: UpdateDocumentTypeDto, actorId: string): Promise<unknown> {
    await this.assertExists(id);

    const updated = await this.prisma.documentType.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.appliesTo !== undefined && { appliesTo: dto.appliesTo }),
        ...(dto.isRequiredDefault !== undefined && { isRequiredDefault: dto.isRequiredDefault }),
        ...(dto.expiryApplicable !== undefined && { expiryApplicable: dto.expiryApplicable }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.emitAudit(AuditAction.UPDATE, actorId, id, `Updated document type ${updated.code}`, dto);
    return updated;
  }

  async remove(id: string, actorId: string): Promise<void> {
    const type = await this.assertExists(id);

    const usageCount = await this.prisma.customerDocument.count({ where: { documentTypeId: id } });
    if (usageCount > 0) {
      throw new BusinessException(`Cannot delete — ${usageCount} uploaded document(s) reference this type. Deactivate instead.`);
    }

    await this.prisma.documentType.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    this.emitAudit(AuditAction.DELETE, actorId, id, `Deleted document type ${type.code}`);
  }

  private async assertExists(id: string) {
    const type = await this.prisma.documentType.findFirst({ where: { id, deletedAt: null } });
    if (!type) throw new ResourceNotFoundException('Document type', id);
    return type;
  }

  private emitAudit(action: AuditAction, userId: string, entityId: string, description: string, newValues?: unknown) {
    this.events.emit('audit.log', {
      userId, action, module: 'documents', entityId, entityType: 'DocumentType', description, newValues, isSuccess: true,
    });
  }
}
