import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { LoanApplicationsController } from './loan-applications.controller';
import { LoanApplicationsService } from './loan-applications.service';
import { WorkflowsModule } from '../workflows/workflows.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CustomersModule, WorkflowsModule, UsersModule],
  controllers: [LoanApplicationsController],
  providers: [LoanApplicationsService],
  exports: [LoanApplicationsService],
})
export class LoanApplicationsModule {}
