import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PrismaService } from '../../../prisma/prisma.service';

@ApiTags('HR - Leaves Admin')
@ApiBearerAuth()
@Controller('hr/leaves/admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminLeaveSetupController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * One-time setup: Create leave entitlements for all active users
   * Safe to call multiple times - only creates missing entitlements
   */
  @Post('setup-entitlements')
  @RequirePermissions('leaves:manage')
  @ApiOperation({ 
    summary: 'Setup leave entitlements for all users',
    description: 'Creates leave entitlements for all active users. Safe to run multiple times.'
  })
  @ApiResponse({ status: 200, description: 'Entitlements created successfully' })
  @ApiResponse({ status: 403, description: 'Requires leaves:manage permission' })
  async setupEntitlements() {
    const year = new Date().getFullYear();
    
    // Get all active users
    const users = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    // Get all active leave types
    const leaveTypes = await this.prisma.leaveType.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        defaultDaysPerYear: true,
      },
    });

    let created = 0;
    let skipped = 0;
    const details: any[] = [];

    // Create entitlements for each user and leave type
    for (const user of users) {
      const userEntitlements: any[] = [];
      
      for (const leaveType of leaveTypes) {
        // Check if entitlement already exists
        const existing = await this.prisma.leaveEntitlement.findFirst({
          where: {
            userId: user.id,
            leaveTypeId: leaveType.id,
            year,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create entitlement
        await this.prisma.leaveEntitlement.create({
          data: {
            user: { connect: { id: user.id } },
            leaveType: { connect: { id: leaveType.id } },
            createdBy: { connect: { id: user.id } },
            year,
            allocatedDays: leaveType.defaultDaysPerYear,
            carryForwardDays: 0,
            adjustmentDays: 0,
          },
        });

        created++;
        userEntitlements.push({
          leaveType: leaveType.name,
          days: leaveType.defaultDaysPerYear.toString(),
        });
      }

      if (userEntitlements.length > 0) {
        details.push({
          username: user.username,
          email: user.email,
          entitlements: userEntitlements,
        });
      }
    }

    return {
      success: true,
      message: 'Leave entitlements setup completed',
      data: {
        year,
        usersProcessed: users.length,
        leaveTypes: leaveTypes.length,
        entitlementsCreated: created,
        entitlementsSkipped: skipped,
        details: details.slice(0, 10), // Show first 10 users for brevity
        totalDetailsAvailable: details.length,
      },
    };
  }
}
