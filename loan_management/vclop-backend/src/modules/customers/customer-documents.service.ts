import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, DocumentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions/app.exceptions';
import { VerifyDocumentDto } from './dto/document-type.dto';

@Injectable()
export class CustomerDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly events: EventEmitter2,
  ) {}

  async findAll(customerId: string): Promise<unknown[]> {
    await this.assertCustomerExists(customerId);
    return this.prisma.customerDocument.findMany({
      where: { customerId },
      include: { documentType: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upload(
    customerId: string,
    documentTypeId: string,
    file: Express.Multer.File,
    actorId: string,
  ): Promise<unknown> {
    await this.assertCustomerExists(customerId);

    const docType = await this.prisma.documentType.findFirst({ where: { id: documentTypeId, deletedAt: null } });
    if (!docType) throw new ResourceNotFoundException('Document type', documentTypeId);

    if (docType.allowedMimeTypes) {
      const allowed = docType.allowedMimeTypes as string[];
      if (allowed.length > 0 && !allowed.includes(file.mimetype)) {
        throw new BusinessException(`${docType.name} must be one of: ${allowed.join(', ')}`);
      }
    }

    const stored = await this.storage.storeFile(file, `customers/${customerId}/documents`);

    // Individual verification: a re-upload of the same document type creates
    // a fresh PENDING record rather than overwriting a verified/rejected one,
    // so the verification history is preserved.
    const document = await this.prisma.customerDocument.create({
      data: {
        customerId,
        documentTypeId,
        fileKey: stored.key,
        fileUrl: stored.url,
        originalName: stored.originalName,
        mimeType: stored.mimeType,
        size: stored.size,
        status: DocumentStatus.PENDING,
        uploadedById: actorId,
      },
    });

    this.emitAudit(AuditAction.CREATE, actorId, document.id, `Uploaded ${docType.name} for customer ${customerId}`);
    await this.refreshProfileCompletion(customerId);

    return this.prisma.customerDocument.findUnique({ where: { id: document.id }, include: { documentType: true } });
  }

  async verify(documentId: string, dto: VerifyDocumentDto, actorId: string): Promise<unknown> {
    const document = await this.assertDocumentExists(documentId);

    if (dto.status === DocumentStatus.REJECTED && !dto.rejectionReason) {
      throw new BusinessException('rejectionReason is required when rejecting a document');
    }
    if (dto.status !== DocumentStatus.VERIFIED && dto.status !== DocumentStatus.REJECTED) {
      throw new BusinessException('status must be VERIFIED or REJECTED');
    }

    const updated = await this.prisma.customerDocument.update({
      where: { id: documentId },
      data: {
        status: dto.status,
        rejectionReason: dto.status === DocumentStatus.REJECTED ? dto.rejectionReason : null,
        verifiedById: actorId,
        verifiedAt: new Date(),
      },
      include: { documentType: true },
    });

    this.emitAudit(
      AuditAction.UPDATE,
      actorId,
      documentId,
      `${dto.status === DocumentStatus.VERIFIED ? 'Verified' : 'Rejected'} ${updated.documentType.name}${dto.rejectionReason ? `: ${dto.rejectionReason}` : ''}`,
    );

    await this.refreshProfileCompletion(document.customerId);
    return updated;
  }

  async remove(documentId: string, actorId: string): Promise<void> {
    const document = await this.assertDocumentExists(documentId);
    await this.storage.deleteFile(document.fileKey);
    await this.prisma.customerDocument.delete({ where: { id: documentId } });
    this.emitAudit(AuditAction.DELETE, actorId, documentId, `Deleted document ${document.id}`);
    await this.refreshProfileCompletion(document.customerId);
  }

  /** Marks any document past its expiryDate as EXPIRED. Intended to be called from a scheduled job once one exists. */
  async expireOverdue(): Promise<number> {
    const result = await this.prisma.customerDocument.updateMany({
      where: { status: DocumentStatus.VERIFIED, expiryDate: { lt: new Date() } },
      data: { status: DocumentStatus.EXPIRED },
    });
    return result.count;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async refreshProfileCompletion(customerId: string): Promise<void> {
    const [requiredTypes, customer] = await Promise.all([
      this.prisma.documentType.count({ where: { isActive: true, isRequiredDefault: true, deletedAt: null } }),
      this.prisma.customer.findUnique({ where: { id: customerId }, select: { type: true } }),
    ]);

    if (!customer || requiredTypes === 0) return;

    const verifiedCount = await this.prisma.customerDocument.count({
      where: {
        customerId,
        status: DocumentStatus.VERIFIED,
        documentType: { isRequiredDefault: true, isActive: true },
      },
    });

    const profileCompletion = Math.min(100, Math.round((verifiedCount / requiredTypes) * 100));
    await this.prisma.customer.update({ where: { id: customerId }, data: { profileCompletion } });
  }

  private async assertCustomerExists(customerId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, deletedAt: null } });
    if (!customer) throw new ResourceNotFoundException('Customer', customerId);
    return customer;
  }

  private async assertDocumentExists(id: string) {
    const document = await this.prisma.customerDocument.findUnique({ where: { id } });
    if (!document) throw new ResourceNotFoundException('Document', id);
    return document;
  }

  private emitAudit(action: AuditAction, userId: string, entityId: string, description: string) {
    this.events.emit('audit.log', {
      userId, action, module: 'documents', entityId, entityType: 'CustomerDocument', description, isSuccess: true,
    });
  }
}
