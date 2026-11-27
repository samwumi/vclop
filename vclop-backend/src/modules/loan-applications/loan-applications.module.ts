import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { LoanApplicationsController } from './loan-applications.controller';
import { LoanApplicationsService } from './loan-applications.service';
import { WorkflowsModule } from '../workflows/workflows.module';
import { UsersModule } from '../users/users.module';
import { DisbursementModule } from '../payments/disbursements/disbursement.module';

@Module({
  imports: [CustomersModule, WorkflowsModule, UsersModule, DisbursementModule],
  controllers: [LoanApplicationsController],
  providers: [LoanApplicationsService],
  exports: [LoanApplicationsService],
})
export class LoanApplicationsModule {}
