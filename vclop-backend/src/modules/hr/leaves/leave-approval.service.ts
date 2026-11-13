import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ApprovalDecision } from '@prisma/client';

@Injectable()
export class LeaveApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Determine required approval levels based on policy
   */
  async determineApprovalLevels(applicationId: string) {
    const application = await this.prisma.leaveApplication.findUnique({
      where: { id: applicationId },
      include: { user: true, leaveType: true },
    });

    if (!application) {
      throw new NotFoundException('Leave application not found');
    }

    // Get current active policy
    const policy = await this.prisma.approvalPolicy.findFirst({
      where: {
        entityType: 'LEAVE_APPLICATION',
        effectiveFrom: { lte: new Date() },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
      },
      orderBy: { version: 'desc' },
    });

    if (!policy) {
      // No policy defined - auto-approve or use default
      return [];
    }

    const policyLevels = JSON.parse(policy.levels);
    const days = Number(application.businessDaysRequested);

    // Filter levels applicable to this request
    const applicableLevels = policyLevels.levels.filter((level: any) => {
      const meetsMin = !level.conditions?.minDays || days >= level.conditions.minDays;
      const meetsMax = !level.conditions?.maxDays || days <= level.conditions.maxDays;
      return meetsMin && meetsMax;
    });

    // Select approver for each level
    const levelsWithApprovers = await Promise.all(
      applicableLevels.map(async (level: any) => {
        const approverId = await this.selectApprover(level, application);
        return {
          ...level,
          approverId,
        };
      }),
    );

    return {
      levels: levelsWithApprovers,
      policyId: policy.id,
    };
  }

  /**
   * Select approver based on criteria
   */
  async selectApprover(levelConfig: any, application: any): Promise<string> {
    const { selectionCriteria } = levelConfig;

    switch (selectionCriteria.type) {
      case 'SUPERVISOR':
        if (!application.user.supervisorId) {
          throw new BadRequestException('Employee has no assigned supervisor');
        }

        const supervisor = await this.prisma.user.findUnique({
          where: { id: application.user.supervisorId },
        });

        if (!supervisor || supervisor.status !== 'ACTIVE') {
          throw new BadRequestException('Supervisor is not active');
        }

        // Check for delegation (if supervisor is on leave)
        return await this.getEffectiveApprover(supervisor.id);

      case 'DEPARTMENT_HEAD':
        const deptHead = await this.prisma.user.findFirst({
          where: {
            departmentId: application.user.departmentId,
            userRoles: {
              some: {
                role: { code: 'DEPARTMENT_HEAD' },
              },
            },
            status: 'ACTIVE',
          },
        });

        if (!deptHead) {
          throw new BadRequestException('No active department head found');
        }

        return await this.getEffectiveApprover(deptHead.id);

      case 'ROLE':
        const roleUsers = await this.prisma.user.findMany({
          where: {
            userRoles: {
              some: {
                role: { name: selectionCriteria.requiredRole },
              },
            },
            status: 'ACTIVE',
          },
        });

        if (roleUsers.length === 0) {
          throw new BadRequestException(
            `No active users with role: ${selectionCriteria.requiredRole}`,
          );
        }

        // If multiple, select based on branch or first available
        const branchUser = roleUsers.find(
          (u) => u.branchId === application.user.branchId,
        );
        const selectedUser = branchUser || roleUsers[0];

        return await this.getEffectiveApprover(selectedUser.id);

      default:
        throw new BadRequestException(
          `Unknown approver selection type: ${selectionCriteria.type}`,
        );
    }
  }

  /**
   * Get effective approver (considering delegation)
   */
  async getEffectiveApprover(userId: string): Promise<string> {
    // Check if user has delegated approval authority
    const delegation = await this.prisma.resourceDelegation.findFirst({
      where: {
        resourceType: 'WORKFLOW_TASK',
        delegatedFrom: userId,
        status: 'ACTIVE',
        effectiveFrom: { lte: new Date() },
        effectiveTo: { gte: new Date() },
        canApproveLoans: true, // Use this as proxy for approval authority
      },
    });

    if (delegation) {
      return delegation.delegatedTo;
    }

    // Check if user is currently on leave or suspended
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        leaveApplications: {
          where: {
            status: 'ACTIVE',
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== 'ACTIVE' || user.leaveApplications.length > 0) {
      // Escalate to their supervisor
      if (user.supervisorId) {
        return await this.getEffectiveApprover(user.supervisorId);
      }
      throw new BadRequestException(
        `Approver ${userId} is unavailable and has no fallback`,
      );
    }

    return userId;
  }

  /**
   * Create approval requests for application
   */
  async createApprovalRequests(applicationId: string) {
    const approvalSetup = await this.determineApprovalLevels(applicationId);

    if (!approvalSetup || !('levels' in approvalSetup) || approvalSetup.levels.length === 0) {
      // No approvals required - auto-approve
      await this.prisma.leaveApplication.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvalNotes: 'Auto-approved (no policy or below threshold)',
        },
      });
      return { autoApproved: true };
    }

    // Create approval records
    const approvals = await Promise.all(
      approvalSetup.levels.map((level: any) =>
        this.prisma.leaveApproval.create({
          data: {
            leaveApplicationId: applicationId,
            approvalLevel: level.level,
            approverId: level.approverId,
            status: 'PENDING',
            policyVersionId: approvalSetup.policyId,
            dueAt: level.escalationHours
              ? new Date(Date.now() + level.escalationHours * 60 * 60 * 1000)
              : null,
          },
        }),
      ),
    );

    return { autoApproved: false, approvals };
  }

  /**
   * Process approval decision
   */
  async processApprovalDecision(
    approvalId: string,
    approverId: string,
    decision: ApprovalDecision,
    comments?: string,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const approval = await tx.leaveApproval.findUnique({
        where: { id: approvalId },
        include: { leaveApplication: true },
      });

      if (!approval) {
        throw new NotFoundException('Approval request not found');
      }

      if (approval.approverId !== approverId) {
        throw new BadRequestException('You are not authorized to approve this request');
      }

      if (approval.status !== 'PENDING') {
        throw new BadRequestException('Approval already processed');
      }

      // Prevent self-approval
      if (approval.leaveApplication.userId === approverId) {
        throw new BadRequestException('Self-approval is not allowed');
      }

      // Update approval record
      await tx.leaveApproval.update({
        where: { id: approvalId },
        data: {
          status: decision === 'APPROVE' ? 'APPROVED' : decision === 'REJECT' ? 'REJECTED' : 'RETURNED',
          decision,
          decidedAt: new Date(),
          comments,
        },
      });

      if (decision === 'REJECT') {
        // Reject entire application
        await tx.leaveApplication.update({
          where: { id: approval.leaveApplicationId },
          data: {
            status: 'REJECTED',
            rejectedById: approverId,
            rejectedAt: new Date(),
            rejectionReason: comments,
          },
        });

        return { status: 'REJECTED', message: 'Leave application rejected' };
      }

      if (decision === 'RETURN_FOR_INFO') {
        // Return to draft
        await tx.leaveApplication.update({
          where: { id: approval.leaveApplicationId },
          data: {
            status: 'DRAFT',
            approvalNotes: comments,
          },
        });

        return { status: 'RETURNED', message: 'Returned for more information' };
      }

      if (decision === 'APPROVE') {
        // Check if all required approvals are complete
        const allApprovals = await tx.leaveApproval.findMany({
          where: { leaveApplicationId: approval.leaveApplicationId },
        });

        const allApproved = allApprovals.every((a) => a.status === 'APPROVED');

        if (allApproved) {
          // Final approval - approve application
          await tx.leaveApplication.update({
            where: { id: approval.leaveApplicationId },
            data: {
              status: 'APPROVED',
              approvedById: approverId,
              approvedAt: new Date(),
              approvalNotes: comments,
            },
          });

          // TODO: Create resource delegations if needed
          // This would integrate with the resources module

          return { status: 'APPROVED', message: 'Leave application approved' };
        }

        return { status: 'PARTIALLY_APPROVED', message: 'Waiting for other approvers' };
      }

      return { status: 'PROCESSED' };
    });
  }

  /**
   * Get pending approvals for an approver
   */
  async getPendingApprovals(approverId: string) {
    const approvals = await this.prisma.leaveApproval.findMany({
      where: {
        approverId,
        status: 'PENDING',
      },
      include: {
        leaveApplication: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                employeeId: true,
                department: true,
                branch: true,
              },
            },
            leaveType: true,
          },
        },
      },
      orderBy: { requestedAt: 'asc' },
    });

    return approvals;
  }

  /**
   * Get approval history for an application
   */
  async getApprovalHistory(applicationId: string) {
    return await this.prisma.leaveApproval.findMany({
      where: { leaveApplicationId: applicationId },
      include: {
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        delegatedFrom: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { approvalLevel: 'asc' },
    });
  }
}
