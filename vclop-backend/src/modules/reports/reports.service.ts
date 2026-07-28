import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction, InstallmentStatus, LoanApplicationStatus, LoanStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  // ── Existing portfolio / disbursements / collections ──────────────────────

  async portfolio(actorId: string) {
    const [loans, byStatus, outstanding] = await Promise.all([
      this.prisma.loan.count(),
      this.prisma.loan.groupBy({ by: ['status'], _count: { _all: true }, _sum: { principal: true, totalRepayable: true } }),
      this.prisma.repaymentInstallment.aggregate({
        where: { status: { not: InstallmentStatus.PAID } },
        _sum: { totalDue: true, amountPaid: true },
      }),
    ]);
    this.audit(actorId, 'Viewed loan portfolio report');
    return {
      loans,
      byStatus,
      outstanding: Number(outstanding._sum.totalDue ?? 0) - Number(outstanding._sum.amountPaid ?? 0),
    };
  }

  async disbursements(actorId: string, from?: Date, to?: Date) {
    const where = from || to ? { disbursedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {};
    const [items, totals] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        include: {
          loanApplication: {
            include: {
              customer: { select: { customerNumber: true, firstName: true, lastName: true, branchId: true } },
              loanProduct: { select: { name: true } },
            },
          },
        },
        orderBy: { disbursedAt: 'desc' },
        take: 500,
      }),
      this.prisma.loan.aggregate({ where, _count: { _all: true }, _sum: { principal: true } }),
    ]);

    // Enrich with officer names
    const officerIds = [...new Set(items.map((l) => l.loanApplication?.submittedById).filter(Boolean) as string[])];
    const officers = officerIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: officerIds } }, select: { id: true, firstName: true, lastName: true } })
      : [];
    const officerMap = Object.fromEntries(officers.map((o) => [o.id, o]));

    const enriched = items.map((l) => ({
      ...l,
      submittedBy: l.loanApplication?.submittedById ? officerMap[l.loanApplication.submittedById] ?? null : null,
    }));

    this.audit(actorId, 'Viewed disbursement report');
    return { items: enriched, totalCount: totals._count._all, totalAmount: Number(totals._sum.principal ?? 0) };
  }

  async collections(actorId: string) {
    const [overdue, cases, repayments] = await Promise.all([
      this.prisma.repaymentInstallment.findMany({
        where: { dueDate: { lt: new Date() }, status: { in: [InstallmentStatus.PENDING, InstallmentStatus.PARTIALLY_PAID, InstallmentStatus.OVERDUE] } },
        include: { loan: { select: { loanNumber: true, customerId: true } } },
        orderBy: { dueDate: 'asc' },
        take: 500,
      }),
      this.prisma.collectionCase.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.repaymentTransaction.aggregate({ _sum: { amount: true } }),
    ]);
    this.audit(actorId, 'Viewed collections report');
    return { overdue, cases, totalRepayments: Number(repayments._sum.amount ?? 0) };
  }

  // ── Location summary ──────────────────────────────────────────────────────

  async locationSummary(actorId: string) {
    const branches = await this.prisma.branch.findMany({
      where: { deletedAt: null, isActive: true, isHeadOffice: false },
      select: { id: true, code: true, name: true },
    });

    const summaries = await Promise.all(
      branches.map(async (branch) => {
        const [customers, applications, disbursed, overdue, officers] = await Promise.all([
          this.prisma.customer.count({ where: { branchId: branch.id, deletedAt: null } }),
          this.prisma.loanApplication.count({ where: { customer: { branchId: branch.id }, deletedAt: null } }),
          this.prisma.loan.aggregate({
            where: { loanApplication: { customer: { branchId: branch.id } }, status: LoanStatus.ACTIVE },
            _sum: { principal: true },
            _count: { _all: true },
          }),
          this.prisma.repaymentInstallment.count({
            where: {
              dueDate: { lt: new Date() },
              status: { in: [InstallmentStatus.OVERDUE, InstallmentStatus.PENDING] },
              loan: { loanApplication: { customer: { branchId: branch.id } } },
            },
          }),
          this.prisma.user.count({ where: { branchId: branch.id, deletedAt: null } }),
        ]);

        const totalPortfolio = Number(disbursed._sum.principal ?? 0);
        const overdueAmount = await this.prisma.repaymentInstallment.aggregate({
          where: {
            dueDate: { lt: new Date() },
            status: { in: [InstallmentStatus.OVERDUE, InstallmentStatus.PENDING] },
            loan: { loanApplication: { customer: { branchId: branch.id } } },
          },
          _sum: { totalDue: true, amountPaid: true },
        });
        const overdueValue =
          Number(overdueAmount._sum.totalDue ?? 0) - Number(overdueAmount._sum.amountPaid ?? 0);
        const par = totalPortfolio > 0 ? (overdueValue / totalPortfolio) * 100 : 0;

        return {
          branchId: branch.id,
          branchCode: branch.code,
          branchName: branch.name,
          customers,
          applications,
          activeLoans: disbursed._count._all,
          portfolioValue: totalPortfolio,
          overdueInstallments: overdue,
          overdueValue,
          par: Math.round(par * 100) / 100,
          officers,
        };
      }),
    );

    this.audit(actorId, 'Viewed location summary report');
    return summaries.sort((a, b) => b.portfolioValue - a.portfolioValue);
  }

  // ── Officer performance ───────────────────────────────────────────────────

  async officerPerformance(actorId: string, from?: Date, to?: Date, branchId?: string) {
    const monthStart = from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthEnd = to ?? new Date();

    const officers = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(branchId ? { branchId } : {}),
        userRoles: {
          some: {
            role: { code: 'LOAN_OFFICER' },
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
      },
      select: {
        id: true, firstName: true, lastName: true, employeeId: true, jobTitle: true,
        branch: { select: { id: true, name: true } },
      },
    });

    const results = await Promise.all(
      officers.map(async (officer) => {
        const [applications, disbursed, customers, target] = await Promise.all([
          this.prisma.loanApplication.count({
            where: { submittedById: officer.id, createdAt: { gte: monthStart, lte: monthEnd }, deletedAt: null },
          }),
          this.prisma.loanApplication.aggregate({
            where: {
              submittedById: officer.id,
              status: LoanApplicationStatus.DISBURSED,
              submittedAt: { gte: monthStart, lte: monthEnd },
              deletedAt: null,
            },
            _sum: { amount: true },
            _count: { _all: true },
          }),
          this.prisma.customer.count({ where: { assignedOfficerId: officer.id, deletedAt: null } }),
          this.prisma.setting.findFirst({
            where: { key: `performance.monthly_target.${officer.id}`, scope: 'SYSTEM', branchId: null },
          }),
        ]);

        const achievement = Number(disbursed._sum.amount ?? 0);
        const monthlyTarget = Number(target?.value ?? 0);
        const progress = monthlyTarget > 0 ? Math.min(100, (achievement / monthlyTarget) * 100) : 0;

        return {
          officerId: officer.id,
          employeeId: officer.employeeId,
          name: `${officer.firstName} ${officer.lastName}`,
          jobTitle: officer.jobTitle,
          branch: officer.branch,
          customers,
          applications,
          disbursements: disbursed._count._all,
          disbursedAmount: achievement,
          monthlyTarget,
          progressPercentage: Math.round(progress * 10) / 10,
        };
      }),
    );

    this.audit(actorId, 'Viewed officer performance report');
    return results.sort((a, b) => b.disbursedAmount - a.disbursedAmount);
  }

  // ── Location drilldown ────────────────────────────────────────────────────

  async locationDrilldown(branchId: string, actorId: string, from?: Date, to?: Date) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) return null;

    const monthStart = from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthEnd = to ?? new Date();

    const [
      customers, applications, loans, overdueInstallments,
      badLoans, officers, repayments, collectionCases,
    ] = await Promise.all([
      // All customers in this branch
      this.prisma.customer.findMany({
        where: { branchId, deletedAt: null },
        select: {
          id: true, customerNumber: true, firstName: true, lastName: true,
          phone: true, status: true, createdAt: true,
          assignedOfficerId: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      // Applications in range
      this.prisma.loanApplication.findMany({
        where: { customer: { branchId }, createdAt: { gte: monthStart, lte: monthEnd }, deletedAt: null },
        select: {
          id: true, applicationNumber: true, amount: true, status: true,
          createdAt: true, submittedAt: true, submittedById: true,
          customer: { select: { firstName: true, lastName: true, customerNumber: true } },
          loanProduct: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      // Active loans
      this.prisma.loan.aggregate({
        where: { loanApplication: { customer: { branchId } }, status: LoanStatus.ACTIVE },
        _sum: { principal: true, totalRepayable: true },
        _count: { _all: true },
      }),
      // Overdue installments
      this.prisma.repaymentInstallment.aggregate({
        where: {
          dueDate: { lt: new Date() },
          status: { in: [InstallmentStatus.OVERDUE, InstallmentStatus.PENDING] },
          loan: { loanApplication: { customer: { branchId } } },
        },
        _sum: { totalDue: true, amountPaid: true },
        _count: { _all: true },
      }),
      // Bad loans (defaulted / written off)
      this.prisma.loan.findMany({
        where: {
          loanApplication: { customer: { branchId } },
          status: { in: [LoanStatus.DEFAULTED, LoanStatus.WRITTEN_OFF] },
        },
        select: {
          loanNumber: true, principal: true, status: true,
          loanApplication: {
            select: {
              customer: { select: { firstName: true, lastName: true, customerNumber: true } },
            },
          },
        },
      }),
      // Officers in this branch
      this.prisma.user.findMany({
        where: { branchId, deletedAt: null },
        select: { id: true, firstName: true, lastName: true, jobTitle: true, employeeId: true },
      }),
      // Total repayments received
      this.prisma.repaymentTransaction.aggregate({
        where: { loan: { loanApplication: { customer: { branchId } } } },
        _sum: { amount: true },
      }),
      // Collection cases for loans in this branch (via loanId)
      (async () => {
        const branchLoanIds = await this.prisma.loan.findMany({
          where: { loanApplication: { customer: { branchId } } },
          select: { id: true },
        });
        const ids = branchLoanIds.map((l) => l.id);
        if (!ids.length) return [] as Array<{ status: string; _count: { _all: number } }>;
        return this.prisma.collectionCase.groupBy({
          by: ['status'],
          _count: { _all: true },
          where: { loanId: { in: ids } },
        });
      })(),
    ]);

    const portfolioValue = Number(loans._sum.principal ?? 0);
    const overdueValue =
      Number(overdueInstallments._sum.totalDue ?? 0) - Number(overdueInstallments._sum.amountPaid ?? 0);
    const par = portfolioValue > 0 ? (overdueValue / portfolioValue) * 100 : 0;

    this.audit(actorId, `Viewed location drilldown report for ${branch.name}`);

    return {
      branch,
      summary: {
        totalCustomers: customers.length,
        totalApplications: applications.length,
        activeLoans: loans._count._all,
        portfolioValue,
        totalRepayments: Number(repayments._sum.amount ?? 0),
        overdueInstallments: overdueInstallments._count._all,
        overdueValue,
        par: Math.round(par * 100) / 100,
        badLoans: badLoans.length,
        officers: officers.length,
      },
      customers,
      applications,
      badLoans,
      officers,
      collectionCases,
      from: monthStart,
      to: monthEnd,
    };
  }

  // ── PAR by location ───────────────────────────────────────────────────────

  async parByLocation(actorId: string) {
    const data = await this.locationSummary(actorId);
    this.audit(actorId, 'Viewed PAR by location report');
    return data.map((loc) => ({
      branchId: loc.branchId,
      branchName: loc.branchName,
      par: loc.par,
      portfolioValue: loc.portfolioValue,
      overdueValue: loc.overdueValue,
    }));
  }

  // ── Excel export helpers ──────────────────────────────────────────────────

  async exportLocationSummary(actorId: string): Promise<Buffer> {
    const data = await this.locationSummary(actorId);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Location Summary');

    ws.columns = [
      { header: 'Location', key: 'branchName', width: 22 },
      { header: 'Officers', key: 'officers', width: 10 },
      { header: 'Customers', key: 'customers', width: 12 },
      { header: 'Applications', key: 'applications', width: 14 },
      { header: 'Active Loans', key: 'activeLoans', width: 13 },
      { header: 'Portfolio (₦)', key: 'portfolioValue', width: 18 },
      { header: 'Overdue (₦)', key: 'overdueValue', width: 16 },
      { header: 'PAR (%)', key: 'par', width: 10 },
    ];

    ws.getRow(1).font = { bold: true };
    data.forEach((row) => ws.addRow(row));

    return Buffer.from(await wb.xlsx.writeBuffer() as ArrayBuffer);
  }

  async exportOfficerPerformance(actorId: string, from?: Date, to?: Date, branchId?: string): Promise<Buffer> {
    const data = await this.officerPerformance(actorId, from, to, branchId);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Officer Performance');

    ws.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 13 },
      { header: 'Name', key: 'name', width: 22 },
      { header: 'Branch', key: 'branchName', width: 18 },
      { header: 'Customers', key: 'customers', width: 12 },
      { header: 'Applications', key: 'applications', width: 13 },
      { header: 'Disbursements', key: 'disbursements', width: 14 },
      { header: 'Disbursed (₦)', key: 'disbursedAmount', width: 18 },
      { header: 'Target (₦)', key: 'monthlyTarget', width: 16 },
      { header: 'Progress (%)', key: 'progressPercentage', width: 13 },
    ];

    ws.getRow(1).font = { bold: true };
    data.forEach((row) =>
      ws.addRow({
        ...row,
        branchName: row.branch?.name ?? '—',
      }),
    );

    return Buffer.from(await wb.xlsx.writeBuffer() as ArrayBuffer);
  }

  async exportDisbursements(actorId: string, from?: Date, to?: Date): Promise<Buffer> {
    const { items } = await this.disbursements(actorId, from, to);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Disbursements');

    ws.columns = [
      { header: 'Loan #', key: 'loanNumber', width: 18 },
      { header: 'Customer', key: 'customer', width: 24 },
      { header: 'Product', key: 'product', width: 22 },
      { header: 'Principal (₦)', key: 'principal', width: 16 },
      { header: 'Loan Officer', key: 'officer', width: 22 },
      { header: 'Disbursed At', key: 'disbursedAt', width: 20 },
    ];

    ws.getRow(1).font = { bold: true };
    items.forEach((loan) => {
      const app = loan.loanApplication;
      const officer = (loan as typeof loan & { submittedBy?: { firstName: string; lastName: string } | null }).submittedBy;
      ws.addRow({
        loanNumber: loan.loanNumber,
        customer: app?.customer
          ? `${app.customer.firstName} ${app.customer.lastName} (${app.customer.customerNumber})`
          : '—',
        product: app?.loanProduct?.name ?? '—',
        principal: Number(loan.principal),
        officer: officer ? `${officer.firstName} ${officer.lastName}` : '—',
        disbursedAt: loan.disbursedAt?.toISOString().split('T')[0] ?? '—',
      });
    });

    return Buffer.from(await wb.xlsx.writeBuffer() as ArrayBuffer);
  }

  private audit(userId: string, description: string) {
    this.events.emit('audit.log', {
      userId,
      action: AuditAction.READ,
      module: 'reports',
      description,
      isSuccess: true,
    });
  }
}
