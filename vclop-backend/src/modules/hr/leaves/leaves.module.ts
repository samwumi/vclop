import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { LeavesService } from './leaves.service';
import { LeaveBalanceService } from './leave-balance.service';
import { LeaveApprovalService } from './leave-approval.service';
import { LeavesController } from './leaves.controller';

@Module({
  imports: [PrismaModule],
  controllers: [LeavesController],
  providers: [LeavesService, LeaveBalanceService, LeaveApprovalService],
  exports: [LeavesService, LeaveBalanceService, LeaveApprovalService],
})
export class LeavesModule {}
