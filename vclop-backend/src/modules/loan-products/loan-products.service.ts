import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/utils/pagination.util';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { BusinessException, ResourceAlreadyExistsException, ResourceNotFoundException } from '../../common/exceptions/app.exceptions';
import { CreateLoanProductDto, UpdateLoanProductDto } from './dto/loan-product.dto';

const INCLUDE = { documentRequirements: { include: { documentType: true } } };

@Injectable()
export class LoanProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async findAll(query: PaginationDto & { isActive?: boolean }): Promise<PaginatedResult<unknown>> {
    const where = {
      deletedAt: null,
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.search && {
        OR: [{ name: { contains: query.search } }, { code: { contains: query.search } }],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.loanProduct.findMany({ where, include: INCLUDE, orderBy: { name: 'asc' }, skip: query.skip, take: query.take }),
      this.prisma.loanProduct.count({ where }),
    ]);

    return paginate(data, total, query.page ?? 1, query.limit ?? 25);
  }

  async findOne(id: string): Promise<unknown> {
    const product = await this.prisma.loanProduct.findFirst({ where: { id, deletedAt: null }, include: INCLUDE });
    if (!product) throw new ResourceNotFoundException('Loan product', id);
    return product;
  }

  async create(dto: CreateLoanProductDto, actorId: string): Promise<unknown> {
    if (dto.minAmount >= dto.maxAmount) throw new BusinessException('minAmount must be less than maxAmount');
    if (dto.minTenureDays >= dto.maxTenureDays) throw new BusinessException('minTenureDays must be less than maxTenureDays');

    const existing = await this.prisma.loanProduct.findFirst({ where: { code: dto.code, deletedAt: null } });
    if (existing) throw new ResourceAlreadyExistsException('Loan product', 'code', dto.code);

    const product = await this.prisma.loanProduct.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        minAmount: dto.minAmount,
        maxAmount: dto.maxAmount,
        minTenureDays: dto.minTenureDays,
        maxTenureDays: dto.maxTenureDays,
        interestType: dto.interestType,
        interestRate: dto.interestRate,
        repaymentFrequency: dto.repaymentFrequency,
        gracePeriodDays: dto.gracePeriodDays ?? 0,
        lateFeeAmount: dto.lateFeeAmount ?? 0,
        penaltyRate: dto.penaltyRate ?? 0,
        processingFeeRate: dto.processingFeeRate ?? 0,
        insuranceRate: dto.insuranceRate ?? 0,
        requiresGuarantor: dto.requiresGuarantor ?? false,
        requiresCollateral: dto.requiresCollateral ?? false,
        createdById: actorId,
        updatedById: actorId,
        documentRequirements: dto.requiredDocumentTypeIds?.length
          ? { create: dto.requiredDocumentTypeIds.map((documentTypeId) => ({ documentTypeId, isRequired: true })) }
          : undefined,
      },
    });

    this.emitAudit(AuditAction.CREATE, actorId, product.id, `Created loan product ${product.code}`);
    return this.findOne(product.id);
  }

  async update(id: string, dto: UpdateLoanProductDto, actorId: string): Promise<unknown> {
    const product = await this.assertExists(id);

    const minAmount = dto.minAmount ?? Number(product.minAmount);
    const maxAmount = dto.maxAmount ?? Number(product.maxAmount);
    if (minAmount >= maxAmount) throw new BusinessException('minAmount must be less than maxAmount');

    await this.prisma.loanProduct.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.minAmount !== undefined && { minAmount: dto.minAmount }),
        ...(dto.maxAmount !== undefined && { maxAmount: dto.maxAmount }),
        ...(dto.minTenureDays !== undefined && { minTenureDays: dto.minTenureDays }),
        ...(dto.maxTenureDays !== undefined && { maxTenureDays: dto.maxTenureDays }),
        ...(dto.interestType && { interestType: dto.interestType }),
        ...(dto.interestRate !== undefined && { interestRate: dto.interestRate }),
        ...(dto.repaymentFrequency && { repaymentFrequency: dto.repaymentFrequency }),
        ...(dto.gracePeriodDays !== undefined && { gracePeriodDays: dto.gracePeriodDays }),
        ...(dto.lateFeeAmount !== undefined && { lateFeeAmount: dto.lateFeeAmount }),
        ...(dto.penaltyRate !== undefined && { penaltyRate: dto.penaltyRate }),
        ...(dto.processingFeeRate !== undefined && { processingFeeRate: dto.processingFeeRate }),
        ...(dto.insuranceRate !== undefined && { insuranceRate: dto.insuranceRate }),
        ...(dto.requiresGuarantor !== undefined && { requiresGuarantor: dto.requiresGuarantor }),
        ...(dto.requiresCollateral !== undefined && { requiresCollateral: dto.requiresCollateral }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        updatedById: actorId,
      },
    });

    if (dto.requiredDocumentTypeIds) {
      await this.prisma.loanProductDocumentRequirement.deleteMany({ where: { loanProductId: id } });
      if (dto.requiredDocumentTypeIds.length) {
        await this.prisma.loanProductDocumentRequirement.createMany({
          data: dto.requiredDocumentTypeIds.map((documentTypeId) => ({ loanProductId: id, documentTypeId, isRequired: true })),
        });
      }
    }

    this.emitAudit(AuditAction.UPDATE, actorId, id, `Updated loan product ${product.code}`, dto as unknown as Prisma.InputJsonValue);
    return this.findOne(id);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const product = await this.assertExists(id);

    const applicationCount = await this.prisma.loanApplication.count({ where: { loanProductId: id } });
    if (applicationCount > 0) {
      throw new BusinessException(`Cannot delete — ${applicationCount} application(s) reference this product. Deactivate it instead.`);
    }

    await this.prisma.loanProduct.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    this.emitAudit(AuditAction.DELETE, actorId, id, `Deleted loan product ${product.code}`);
  }

  private async assertExists(id: string) {
    const product = await this.prisma.loanProduct.findFirst({ where: { id, deletedAt: null } });
    if (!product) throw new ResourceNotFoundException('Loan product', id);
    return product;
  }

  private emitAudit(action: AuditAction, userId: string, entityId: string, description: string, newValues?: unknown) {
    this.events.emit('audit.log', {
      userId, action, module: 'loan-products', entityId, entityType: 'LoanProduct', description, newValues, isSuccess: true,
    });
  }
}
