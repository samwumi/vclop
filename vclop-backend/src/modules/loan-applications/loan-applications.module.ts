import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { LoanApplicationsController } from './loan-applications.controller';
import { LoanApplicationsService } from './loan-applications.service';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [CustomersModule, WorkflowsModule],
  controllers: [LoanApplicationsController],
  providers: [LoanApplicationsService],
  exports: [LoanApplicationsService],
})
export class LoanApplicationsModule {}
