import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { StaffLoansService } from './staff-loans.service';
import { RepaymentService } from './repayment.service';
import { PaymentService } from './payment.service';
import { StaffLoansController } from './staff-loans.controller';

@Module({
  imports: [PrismaModule],
  controllers: [StaffLoansController],
  providers: [StaffLoansService, RepaymentService, PaymentService],
  exports: [StaffLoansService, RepaymentService, PaymentService],
})
export class StaffLoansModule {}
