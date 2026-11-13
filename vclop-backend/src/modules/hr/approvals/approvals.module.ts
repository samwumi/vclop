import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';

/**
 * Approvals Module
 * 
 * Note: Approval logic is currently integrated into:
 * - LeaveApprovalService (leaves module)
 * - Staff loans approval (staff-loans module)
 * 
 * This module is a placeholder for future centralized approval engine
 * that can be shared across all approval workflows.
 */
@Module({
  imports: [PrismaModule],
  providers: [],
  exports: [],
})
export class ApprovalsModule {}
