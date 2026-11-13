import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResourceType, DelegationStatus } from '@prisma/client';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get effective handler for a resource (ownership vs delegation)
   */
  async getEffectiveHandler(
    resourceType: ResourceType,
    resourceId: string,
  ): Promise<{ userId: string; isDelegated: boolean }> {
    // Build where clause based on resource type
    const where: any = {
      resourceType,
      status: 'ACTIVE',
      effectiveFrom: { lte: new Date() },
      effectiveTo: { gte: new Date() },
    };

    // Map resourceId to correct field
    switch (resourceType) {
      case 'CUSTOMER':
        where.customerId = resourceId;
        break;
      case 'LOAN_APPLICATION':
        where.loanApplicationId = resourceId;
        break;
      case 'RECOVERY_ACCOUNT':
        where.recoveryAccountId = resourceId;
        break;
      case 'WORKFLOW_TASK':
        where.workflowTaskId = resourceId;
        break;
    }

    // Check for active delegation
    const activeDelegation = await this.prisma.resourceDelegation.findFirst({
      where,
    });

    if (activeDelegation) {
      return {
        userId: activeDelegation.delegatedTo,
        isDelegated: true,
      };
    }

    // Fall back to ownership
    const ownershipWhere: any = {
      resourceType,
      effectiveTo: null, // Current owner
    };

    // Map resourceId to correct field for ownership
    switch (resourceType) {
      case 'CUSTOMER':
        ownershipWhere.customerId = resourceId;
        break;
      case 'LOAN_APPLICATION':
        ownershipWhere.loanApplicationId = resourceId;
        break;
      case 'RECOVERY_ACCOUNT':
        ownershipWhere.recoveryAccountId = resourceId;
        break;
      case 'WORKFLOW_TASK':
        ownershipWhere.workflowTaskId = resourceId;
        break;
    }

    const ownership = await this.prisma.resourceOwnership.findFirst({
      where: ownershipWhere,
    });

    if (!ownership) {
      throw new NotFoundException('No handler found for this resource');
    }

    return {
      userId: ownership.ownerId,
      isDelegated: false,
    };
  }

  /**
   * Create permanent resource ownership
   */
  async assignOwnership(data: {
    resourceType: ResourceType;
    resourceId: string;
    ownerId: string;
    assignedById: string;
    effectiveFrom: Date;
    reason: string;
  }) {
    return await this.prisma.$transaction(async (tx) => {
      // Build where clause based on resource type
      const whereClause: any = {
        resourceType: data.resourceType,
        effectiveTo: null,
      };

      // Map resourceId to correct field
      switch (data.resourceType) {
        case 'CUSTOMER':
          whereClause.customerId = data.resourceId;
          break;
        case 'LOAN_APPLICATION':
          whereClause.loanApplicationId = data.resourceId;
          break;
        case 'RECOVERY_ACCOUNT':
          whereClause.recoveryAccountId = data.resourceId;
          break;
        case 'WORKFLOW_TASK':
          whereClause.workflowTaskId = data.resourceId;
          break;
      }

      // Close previous ownership if exists
      await tx.resourceOwnership.updateMany({
        where: whereClause,
        data: {
          effectiveTo: data.effectiveFrom,
        },
      });

      // Build create data
      const createData: any = {
        resourceType: data.resourceType,
        ownerId: data.ownerId,
        assignedById: data.assignedById,
        effectiveFrom: data.effectiveFrom,
        changeReason: 'INITIAL_ASSIGNMENT',
        notes: data.reason,
      };

      // Map resourceId to correct field
      switch (data.resourceType) {
        case 'CUSTOMER':
          createData.customerId = data.resourceId;
          break;
        case 'LOAN_APPLICATION':
          createData.loanApplicationId = data.resourceId;
          break;
        case 'RECOVERY_ACCOUNT':
          createData.recoveryAccountId = data.resourceId;
          break;
        case 'WORKFLOW_TASK':
          createData.workflowTaskId = data.resourceId;
          break;
      }

      // Create new ownership
      const ownership = await tx.resourceOwnership.create({
        data: createData,
      });

      return ownership;
    });
  }

  /**
   * Create temporary delegation (for leave)
   */
  async createDelegation(data: {
    resourceType: ResourceType;
    resourceId: string;
    delegatedFrom: string;
    delegatedTo: string;
    effectiveFrom: Date;
    effectiveTo: Date;
    reason: string;
    relatedLeaveId?: string;
    permissions?: {
      canRead?: boolean;
      canUpdate?: boolean;
      canApproveLoans?: boolean;
      canDisburse?: boolean;
      canCollect?: boolean;
    };
  }) {
    // Build ownership where clause
    const ownershipWhere: any = {
      resourceType: data.resourceType,
      ownerId: data.delegatedFrom,
      effectiveTo: null,
    };

    // Map resourceId to correct field
    switch (data.resourceType) {
      case 'CUSTOMER':
        ownershipWhere.customerId = data.resourceId;
        break;
      case 'LOAN_APPLICATION':
        ownershipWhere.loanApplicationId = data.resourceId;
        break;
      case 'RECOVERY_ACCOUNT':
        ownershipWhere.recoveryAccountId = data.resourceId;
        break;
      case 'WORKFLOW_TASK':
        ownershipWhere.workflowTaskId = data.resourceId;
        break;
    }

    // Verify current owner
    const ownership = await this.prisma.resourceOwnership.findFirst({
      where: ownershipWhere,
    });

    if (!ownership) {
      throw new BadRequestException('You are not the current owner of this resource');
    }

    // Build conflict check where clause
    const conflictWhere: any = {
      resourceType: data.resourceType,
      status: { in: ['PENDING_ACCEPTANCE', 'ACTIVE'] },
      OR: [
        {
          effectiveFrom: { lte: data.effectiveTo },
          effectiveTo: { gte: data.effectiveFrom },
        },
      ],
    };

    // Map resourceId to correct field
    switch (data.resourceType) {
      case 'CUSTOMER':
        conflictWhere.customerId = data.resourceId;
        break;
      case 'LOAN_APPLICATION':
        conflictWhere.loanApplicationId = data.resourceId;
        break;
      case 'RECOVERY_ACCOUNT':
        conflictWhere.recoveryAccountId = data.resourceId;
        break;
      case 'WORKFLOW_TASK':
        conflictWhere.workflowTaskId = data.resourceId;
        break;
    }

    // Check for conflicting delegations
    const conflict = await this.prisma.resourceDelegation.findFirst({
      where: conflictWhere,
    });

    if (conflict) {
      throw new BadRequestException('Conflicting delegation exists for this period');
    }

    // Build create data
    const createData: any = {
      resourceType: data.resourceType,
      delegatedFrom: data.delegatedFrom,
      delegatedTo: data.delegatedTo,
      effectiveFrom: data.effectiveFrom,
      effectiveTo: data.effectiveTo,
      delegationReason: data.reason as any,
      relatedLeaveId: data.relatedLeaveId,
      canModifyCustomer: data.permissions?.canUpdate ?? true,
      canApproveLoans: data.permissions?.canApproveLoans ?? false,
      canDisburseFunds: data.permissions?.canDisburse ?? false,
      canViewSensitiveData: data.permissions?.canRead ?? false,
      status: 'PENDING_ACCEPTANCE',
      createdById: data.delegatedFrom,
    };

    // Map resourceId to correct field
    switch (data.resourceType) {
      case 'CUSTOMER':
        createData.customerId = data.resourceId;
        break;
      case 'LOAN_APPLICATION':
        createData.loanApplicationId = data.resourceId;
        break;
      case 'RECOVERY_ACCOUNT':
        createData.recoveryAccountId = data.resourceId;
        break;
      case 'WORKFLOW_TASK':
        createData.workflowTaskId = data.resourceId;
        break;
    }

    // Create delegation
    const delegation = await this.prisma.resourceDelegation.create({
      data: createData,
      include: {
        delegator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        delegate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return delegation;
  }

  /**
   * Accept or reject delegation
   */
  async respondToDelegation(
    delegationId: string,
    userId: string,
    accept: boolean,
    responseNotes?: string,
  ) {
    const delegation = await this.prisma.resourceDelegation.findUnique({
      where: { id: delegationId },
    });

    if (!delegation) {
      throw new NotFoundException('Delegation not found');
    }

    if (delegation.delegatedTo !== userId) {
      throw new BadRequestException('You are not the delegate');
    }

    if (delegation.status !== 'PENDING_ACCEPTANCE') {
      throw new BadRequestException('Delegation already processed');
    }

    const newStatus = accept ? 'ACTIVE' : 'DECLINED';

    const updated = await this.prisma.resourceDelegation.update({
      where: { id: delegationId },
      data: {
        status: accept ? 'ACTIVE' : 'REJECTED',
        acceptedAt: accept ? new Date() : null,
        ...(accept 
          ? { acceptedNotes: responseNotes } 
          : { rejectedAt: new Date(), rejectionReason: responseNotes }),
      },
    });

    return updated;
  }

  /**
   * Revoke delegation
   */
  async revokeDelegation(
    delegationId: string,
    revokedById: string,
    reason: string,
  ) {
    const delegation = await this.prisma.resourceDelegation.findUnique({
      where: { id: delegationId },
    });

    if (!delegation) {
      throw new NotFoundException('Delegation not found');
    }

    if (
      delegation.delegatedFrom !== revokedById &&
      delegation.delegatedTo !== revokedById
    ) {
      throw new BadRequestException('Only delegator or delegate can revoke');
    }

    if (!['PENDING', 'ACTIVE'].includes(delegation.status)) {
      throw new BadRequestException('Cannot revoke this delegation');
    }

    const updated = await this.prisma.resourceDelegation.update({
      where: { id: delegationId },
      data: {
        status: 'REVOKED',
        rejectionReason: reason, // Use existing field for revocation reason
      },
    });

    return updated;
  }

  /**
   * Get my resources (ownership)
   */
  async getMyResources(userId: string, includeHistory: boolean = false) {
    const where: any = {
      ownerId: userId,
    };

    if (!includeHistory) {
      where.effectiveTo = null; // Current only
    }

    return await this.prisma.resourceOwnership.findMany({
      where,
      include: {
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  /**
   * Get delegations (sent or received)
   */
  async getDelegations(
    userId: string,
    type: 'sent' | 'received',
    status?: DelegationStatus,
  ) {
    const where: any = {};

    if (type === 'sent') {
      where.delegatedFrom = userId;
    } else {
      where.delegatedTo = userId;
    }

    if (status) {
      where.status = status;
    }

    return await this.prisma.resourceDelegation.findMany({
      where,
      include: {
        delegator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        delegate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  /**
   * Expire past delegations (scheduled job)
   */
  async expirePastDelegations() {
    const now = new Date();

    const result = await this.prisma.resourceDelegation.updateMany({
      where: {
        status: 'ACTIVE',
        effectiveTo: { lt: now },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return result.count;
  }

  /**
   * Get resource history (ownership + delegations)
   */
  async getResourceHistory(resourceType: ResourceType, resourceId: string) {
    // Build ownership where clause
    const ownershipWhere: any = { resourceType };
    switch (resourceType) {
      case 'CUSTOMER':
        ownershipWhere.customerId = resourceId;
        break;
      case 'LOAN_APPLICATION':
        ownershipWhere.loanApplicationId = resourceId;
        break;
      case 'RECOVERY_ACCOUNT':
        ownershipWhere.recoveryAccountId = resourceId;
        break;
      case 'WORKFLOW_TASK':
        ownershipWhere.workflowTaskId = resourceId;
        break;
    }

    const ownership = await this.prisma.resourceOwnership.findMany({
      where: ownershipWhere,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    // Build delegations where clause
    const delegationsWhere: any = { resourceType };
    switch (resourceType) {
      case 'CUSTOMER':
        delegationsWhere.customerId = resourceId;
        break;
      case 'LOAN_APPLICATION':
        delegationsWhere.loanApplicationId = resourceId;
        break;
      case 'RECOVERY_ACCOUNT':
        delegationsWhere.recoveryAccountId = resourceId;
        break;
      case 'WORKFLOW_TASK':
        delegationsWhere.workflowTaskId = resourceId;
        break;
    }

    const delegations = await this.prisma.resourceDelegation.findMany({
      where: delegationsWhere,
      include: {
        delegator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        delegate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    return { ownership, delegations };
  }
}
