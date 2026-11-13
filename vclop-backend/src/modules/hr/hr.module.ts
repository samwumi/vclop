import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmploymentModule } from './employment/employment.module';
import { LeavesModule } from './leaves/leaves.module';
import { StaffLoansModule } from './staff-loans/staff-loans.module';
import { ResourcesModule } from './resources/resources.module';
import { OffboardingModule } from './offboarding/offboarding.module';
import { ApprovalsModule } from './approvals/approvals.module';

@Module({
  imports: [
    PrismaModule,
    EmploymentModule,
    LeavesModule,
    StaffLoansModule,
    ResourcesModule,
    OffboardingModule,
    ApprovalsModule,
  ],
  exports: [
    EmploymentModule,
    LeavesModule,
    StaffLoansModule,
    ResourcesModule,
    OffboardingModule,
    ApprovalsModule,
  ],
})
export class HrModule {}
