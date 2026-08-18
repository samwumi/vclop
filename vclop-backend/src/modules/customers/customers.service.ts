import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, CustomerStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/utils/pagination.util';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions/app.exceptions';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto, UpdateCustomerStatusDto } from './dto/update-customer.dto';
import { FormSubmissionsService } from '../forms/form-submissions.service';

// Stages a customer must have passed through before a loan application can be
// opened against them. Kept here (not in the Business Rules Engine) because
// it's a structural precondition, not a configurable business rule.
const ELIGIBLE_STATUSES: CustomerStatus[] = [CustomerStatus.ELIGIBLE];

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly formSubmissions: FormSubmissionsService,
  ) {}

  async findAll(query: PaginationDto & { status?: CustomerStatus; branchId?: string; branchIds?: string[]; assignedOfficerId?: string }): Promise<PaginatedResult<unknown>> {
    const where = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      // Support single branchId or multiple branchIds
      ...(query.branchIds?.length
        ? { branchId: { in: query.branchIds } }
        : query.branchId
          ? { branchId: query.branchId }
          : {}),
      ...(query.assignedOfficerId && { assignedOfficerId: query.assignedOfficerId }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search } },
          { lastName: { contains: query.search } },
          { businessName: { contains: query.search } },
          { phone: { contains: query.search } },
          { email: { contains: query.search } },
          { customerNumber: { contains: query.search } },
          { bvn: { contains: query.search } },
          { nin: { contains: query.search } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        include: { _count: { select: { documents: true } } },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return paginate(data, total, query.page ?? 1, query.limit ?? 25);
  }

  /** Customer 360: profile + documents + dynamic form data. Loans/applications/virtual accounts/transactions get added here as those modules land. */
  async findOne(id: string): Promise<unknown> {
    const customer = await this.assertExists(id);

    const [documents, formData, recentActivity] = await Promise.all([
      this.prisma.customerDocument.findMany({
        where: { customerId: id },
        include: { documentType: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.formSubmissions.findForEntity(
        (await this.getDefaultCustomerFormId()) ?? '',
        'CUSTOMER',
        id,
      ).catch(() => null),
      this.prisma.auditLog.findMany({
        where: { entityType: 'Customer', entityId: id },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
    ]);

    return {
      profile: customer,
      documents,
      formData,
      timeline: recentActivity,
    };
  }

  async create(dto: CreateCustomerDto, actorId: string): Promise<unknown> {
    await this.assertNoDuplicates(dto.phone, dto.email, dto.bvn, dto.nin);

    if (dto.type === 'BUSINESS' && !dto.businessName) {
      throw new BusinessException('businessName is required for a BUSINESS customer');
    }

    const customerNumber = await this.generateCustomerNumber();

    const customer = await this.prisma.customer.create({
      data: {
        customerNumber,
        type: dto.type ?? 'INDIVIDUAL',
        status: CustomerStatus.REGISTERED,
        firstName: dto.firstName,
        lastName: dto.lastName,
        middleName: dto.middleName,
        businessName: dto.businessName,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        email: dto.email,
        bvn: dto.bvn,
        nin: dto.nin,
        bankAccountNumber: dto.bankAccountNumber,
        bankCode: dto.bankCode,
        residentialAddress: dto.residentialAddress,
        businessAddress: dto.businessAddress,
        gpsLat: dto.gpsLat,
        gpsLng: dto.gpsLng,
        // Employment & NOK
        employerName: dto.employerName,
        employmentType: dto.employmentType,
        jobTitle: dto.jobTitle,
        monthlyIncome: dto.monthlyIncome,
        employerPhone: dto.employerPhone,
        employerAddress: dto.employerAddress,
        nokName: dto.nokName,
        nokRelationship: dto.nokRelationship,
        nokPhone: dto.nokPhone,
        nokAddress: dto.nokAddress,
        // NDPA Consent
        dataProcessingConsent: dto.dataProcessingConsent,
        dataProcessingConsentDate: dto.dataProcessingConsent ? new Date() : null,
        dataProcessingConsentIp: null, // Will be captured in controller
        marketingConsent: dto.marketingConsent ?? false,
        marketingConsentDate: dto.marketingConsent ? new Date() : null,
        creditBureauConsent: dto.creditBureauConsent,
        creditBureauConsentDate: dto.creditBureauConsent ? new Date() : null,
        thirdPartyDataSharingConsent: dto.thirdPartyDataSharingConsent ?? false,
        thirdPartyDataSharingConsentDate: dto.thirdPartyDataSharingConsent ? new Date() : null,
        consentVersion: 'v1.0',
        branchId: dto.branchId,
        assignedOfficerId: dto.assignedOfficerId ?? actorId,
        createdById: actorId,
        updatedById: actorId,
      },
    });

    this.emitAudit(AuditAction.CREATE, actorId, customer.id, `Registered customer ${customer.customerNumber}`);
    return this.findOne(customer.id);
  }

  async update(id: string, dto: UpdateCustomerDto, actorId: string): Promise<unknown> {
    await this.assertExists(id);

    if (dto.phone || dto.email || dto.bvn || dto.nin) {
      await this.assertNoDuplicates(dto.phone, dto.email, dto.bvn, dto.nin, id);
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.middleName !== undefined && { middleName: dto.middleName }),
        ...(dto.businessName !== undefined && { businessName: dto.businessName }),
        ...(dto.gender && { gender: dto.gender }),
        ...(dto.dateOfBirth && { dateOfBirth: new Date(dto.dateOfBirth) }),
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.alternatePhone !== undefined && { alternatePhone: dto.alternatePhone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.bvn !== undefined && { bvn: dto.bvn }),
        ...(dto.nin !== undefined && { nin: dto.nin }),
        ...(dto.residentialAddress !== undefined && { residentialAddress: dto.residentialAddress }),
        ...(dto.businessAddress !== undefined && { businessAddress: dto.businessAddress }),
        ...(dto.gpsLat !== undefined && { gpsLat: dto.gpsLat }),
        ...(dto.gpsLng !== undefined && { gpsLng: dto.gpsLng }),
        ...(dto.branchId !== undefined && { branchId: dto.branchId }),
        ...(dto.assignedOfficerId !== undefined && { assignedOfficerId: dto.assignedOfficerId }),
        // Employment & NOK
        ...(dto.employerName !== undefined && { employerName: dto.employerName }),
        ...(dto.employmentType !== undefined && { employmentType: dto.employmentType }),
        ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle }),
        ...(dto.monthlyIncome !== undefined && { monthlyIncome: dto.monthlyIncome }),
        ...(dto.employerPhone !== undefined && { employerPhone: dto.employerPhone }),
        ...(dto.employerAddress !== undefined && { employerAddress: dto.employerAddress }),
        ...(dto.nokName !== undefined && { nokName: dto.nokName }),
        ...(dto.nokRelationship !== undefined && { nokRelationship: dto.nokRelationship }),
        ...(dto.nokPhone !== undefined && { nokPhone: dto.nokPhone }),
        ...(dto.nokAddress !== undefined && { nokAddress: dto.nokAddress }),
        ...(dto.bankAccountNumber !== undefined && { bankAccountNumber: dto.bankAccountNumber }),
        ...(dto.bankCode !== undefined && { bankCode: dto.bankCode }),
        updatedById: actorId,
      },
    });

    this.emitAudit(AuditAction.UPDATE, actorId, id, `Updated customer ${updated.customerNumber}`, dto);
    return this.findOne(id);
  }

  async updateStatus(id: string, dto: UpdateCustomerStatusDto, actorId: string): Promise<unknown> {
    const customer = await this.assertExists(id);

    await this.prisma.customer.update({
      where: { id },
      data: { status: dto.status, updatedById: actorId },
    });

    this.emitAudit(
      AuditAction.UPDATE,
      actorId,
      id,
      `Status changed ${customer.status} -> ${dto.status}${dto.reason ? `: ${dto.reason}` : ''}`,
    );

    this.events.emit('customer.status_changed', {
      customerId: id,
      from: customer.status,
      to: dto.status,
      actorId,
    });

    return this.findOne(id);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const customer = await this.assertExists(id);

    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.emitAudit(AuditAction.DELETE, actorId, id, `Deleted customer ${customer.customerNumber}`);
  }

  isEligible(status: CustomerStatus): boolean {
    return ELIGIBLE_STATUSES.includes(status);
  }

  async exportCsv(query: PaginationDto & { status?: CustomerStatus; branchId?: string; branchIds?: string[]; assignedOfficerId?: string }): Promise<string> {
    const where = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.branchIds?.length
        ? { branchId: { in: query.branchIds } }
        : query.branchId
          ? { branchId: query.branchId }
          : {}),
      ...(query.assignedOfficerId && { assignedOfficerId: query.assignedOfficerId }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search } },
          { lastName: { contains: query.search } },
          { phone: { contains: query.search } },
          { customerNumber: { contains: query.search } },
          { bvn: { contains: query.search } },
        ],
      }),
    };

    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5000,
      select: {
        customerNumber: true, firstName: true, middleName: true, lastName: true,
        type: true, status: true, phone: true, alternatePhone: true, email: true,
        bvn: true, nin: true, gender: true, dateOfBirth: true,
        residentialAddress: true, businessAddress: true,
        employerName: true, employmentType: true, jobTitle: true, monthlyIncome: true,
        nokName: true, nokRelationship: true, nokPhone: true,
        createdAt: true,
      },
    });

    const headers = [
      'Customer No.', 'First Name', 'Middle Name', 'Last Name', 'Type', 'Status',
      'Phone', 'Alt Phone', 'Email', 'BVN', 'NIN', 'Gender', 'Date of Birth',
      'Residential Address', 'Business Address',
      'Employer', 'Employment Type', 'Job Title', 'Monthly Income',
      'NOK Name', 'NOK Relationship', 'NOK Phone',
      'Registered',
    ];

    const escape = (v: unknown) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    };

    const rows = customers.map((c) => [
      c.customerNumber, c.firstName, c.middleName ?? '', c.lastName,
      c.type, c.status, c.phone, c.alternatePhone ?? '', c.email ?? '',
      c.bvn ?? '', c.nin ?? '', c.gender ?? '',
      c.dateOfBirth ? new Date(c.dateOfBirth).toLocaleDateString('en-NG') : '',
      c.residentialAddress ?? '', c.businessAddress ?? '',
      c.employerName ?? '', c.employmentType ?? '', c.jobTitle ?? '',
      c.monthlyIncome != null ? Number(c.monthlyIncome) : '',
      c.nokName ?? '', c.nokRelationship ?? '', c.nokPhone ?? '',
      new Date(c.createdAt).toLocaleDateString('en-NG'),
    ].map(escape).join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async assertExists(id: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
    if (!customer) throw new ResourceNotFoundException('Customer', id);
    return customer;
  }

  private async assertNoDuplicates(
    phone?: string,
    email?: string,
    bvn?: string,
    nin?: string,
    excludeId?: string,
  ): Promise<void> {
    const or: Record<string, string>[] = [];
    if (phone) or.push({ phone });
    if (email) or.push({ email });
    if (bvn) or.push({ bvn });
    if (nin) or.push({ nin });
    if (or.length === 0) return;

    const existing = await this.prisma.customer.findFirst({
      where: { deletedAt: null, OR: or, ...(excludeId && { NOT: { id: excludeId } }) },
    });

    if (existing) {
      const field =
        existing.phone === phone ? 'phone' :
        existing.email === email ? 'email' :
        existing.bvn === bvn ? 'bvn' : 'nin';
      throw new BusinessException(
        `A customer already exists with this ${field} (${existing.customerNumber}) — no duplicate customers are allowed`,
      );
    }
  }

  private async generateCustomerNumber(): Promise<string> {
    const count = await this.prisma.customer.count();
    const next = (count + 1).toString().padStart(6, '0');
    return `VC-${next}`;
  }

  private async getDefaultCustomerFormId(): Promise<string | undefined> {
    const template = await this.prisma.formTemplate.findFirst({
      where: { entityType: 'CUSTOMER', isDefault: true, isActive: true, deletedAt: null },
      select: { id: true },
    });
    return template?.id;
  }

  private emitAudit(action: AuditAction, userId: string, entityId: string, description: string, newValues?: unknown) {
    this.events.emit('audit.log', {
      userId,
      action,
      module: 'customers',
      entityId,
      entityType: 'Customer',
      description,
      newValues,
      isSuccess: true,
    });
  }
}
