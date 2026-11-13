import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RepaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate flat interest repayment schedule
   * Formula: Total = Principal + (Principal × Rate × Tenure)
   * Monthly = Total / Tenure
   */
  async generateRepaymentSchedule(
    loanId: string,
    principal: number,
    interestRate: number,
    tenureMonths: number,
    disbursementDate: Date,
  ) {
    // Calculate total amount with flat interest
    const totalInterest = principal * (interestRate / 100) * (tenureMonths / 12);
    const totalAmount = principal + totalInterest;
    const monthlyInstallment = totalAmount / tenureMonths;

    // Generate installments
    const installments = [];
    const currentDate = new Date(disbursementDate);

    for (let i = 1; i <= tenureMonths; i++) {
      // Calculate due date (first day of month)
      currentDate.setMonth(currentDate.getMonth() + 1);
      const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      installments.push({
        staffLoanId: loanId,
        installmentNumber: i,
        dueDate,
        principalDue: principal / tenureMonths,
        interestDue: totalInterest / tenureMonths,
        totalDue: monthlyInstallment,
        principalBalanceBefore: principal - (principal / tenureMonths) * (i - 1),
        principalBalanceAfter: principal - (principal / tenureMonths) * i,
        status: 'PENDING' as any,
      });
    }

    // Create all installments
    await this.prisma.staffLoanInstallment.createMany({
      data: installments,
    });

    return installments;
  }

  /**
   * Calculate outstanding balance
   */
  async calculateOutstandingBalance(loanId: string): Promise<number> {
    const installments = await this.prisma.staffLoanInstallment.findMany({
      where: { staffLoanId: loanId },
      include: {
        payments: {
          where: {
            isReversed: false,
            isVerified: true,
          },
        },
      },
    });

    let totalDue = 0;
    let totalPaid = 0;

    for (const inst of installments) {
      totalDue += Number(inst.totalDue);
      totalPaid += inst.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    }

    return totalDue - totalPaid;
  }

  /**
   * Get overdue installments
   */
  async getOverdueInstallments(loanId: string) {
    return await this.prisma.staffLoanInstallment.findMany({
      where: {
        staffLoanId: loanId,
        status: { in: ['PENDING', 'PARTIALLY_PAID'] },
        dueDate: { lt: new Date() },
      },
      orderBy: { installmentNumber: 'asc' },
    });
  }

  /**
   * Get next installment due
   */
  async getNextInstallment(loanId: string) {
    return await this.prisma.staffLoanInstallment.findFirst({
      where: {
        staffLoanId: loanId,
        status: { in: ['PENDING', 'PARTIALLY_PAID'] },
      },
      orderBy: { installmentNumber: 'asc' },
    });
  }

  /**
   * Mark installments as overdue (scheduled job)
   */
  async markOverdueInstallments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.prisma.staffLoanInstallment.updateMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: today },
      },
      data: { status: 'OVERDUE' },
    });

    return result.count;
  }
}
