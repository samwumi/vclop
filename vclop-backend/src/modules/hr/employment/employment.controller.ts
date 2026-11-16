import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { EmploymentService } from './employment.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';

@Controller('hr/employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmploymentController {
  constructor(private readonly employmentService: EmploymentService) {}

  @Get(':id/employment-history')
  async getEmploymentHistory(
    @Param('id') userId: string,
    @Request() req: any,
  ) {
    // Allow users to view their own employment history, or require employees:read permission
    const isOwnData = req.user.id === userId;
    const hasPermission = Array.isArray(req.user.permissions) && req.user.permissions.includes('employees:read');
    
    if (!isOwnData && !hasPermission) {
      throw new ForbiddenException('Insufficient permissions to view this employment history');
    }
    
    return this.employmentService.getEmploymentHistory(userId);
  }

  @Get(':id/current-employment')
  async getCurrentEmployment(
    @Param('id') userId: string,
    @Request() req: any,
  ) {
    // Allow users to view their own current employment, or require employees:read permission
    const isOwnData = req.user.id === userId;
    const hasPermission = Array.isArray(req.user.permissions) && req.user.permissions.includes('employees:read');
    
    if (!isOwnData && !hasPermission) {
      throw new ForbiddenException('Insufficient permissions to view this employment history');
    }
    
    return this.employmentService.getCurrentEmployment(userId);
  }

  /**
   * Self-service: Employee creates their own employment record
   * No permission check - any logged-in user can create their OWN record
   */
  @Post('my-employment')
  async createMyEmployment(
    @Body()
    body: {
      hireDate: string;
      jobTitle: string;
      departmentId: string;
      branchId: string;
      contractType: string;
    },
    @Request() req: any,
  ) {
    // Employee can only create their own record
    return this.employmentService.createEmploymentPeriod({
      userId: req.user.id, // Use logged-in user's ID
      hireDate: new Date(body.hireDate),
      jobTitle: body.jobTitle,
      departmentId: body.departmentId,
      branchId: body.branchId,
      contractType: body.contractType as any,
      salary: undefined, // Employees don't set salary, HR does
      createdById: req.user.id,
    });
  }

  @Post(':id/employment')
  @RequirePermissions('employees:create')
  async createEmployment(
    @Param('id') userId: string,
    @Body()
    body: {
      hireDate: string;
      jobTitle: string;
      departmentId: string;
      branchId: string;
      contractType: string;
      salary?: number;
    },
    @Request() req: any,
  ) {
    return this.employmentService.createEmploymentPeriod({
      userId,
      hireDate: new Date(body.hireDate),
      jobTitle: body.jobTitle,
      departmentId: body.departmentId,
      branchId: body.branchId,
      contractType: body.contractType as any,
      salary: body.salary,
      createdById: req.user.id,
    });
  }

  @Put(':id/salary')
  @RequirePermissions('employees:update_salary')
  async updateSalary(
    @Param('id') userId: string,
    @Body()
    body: {
      employmentPeriodId: string;
      newSalary: number;
      effectiveDate: string;
    },
    @Request() req: any,
  ) {
    return this.employmentService.updateSalary(
      body.employmentPeriodId,
      body.newSalary,
      new Date(body.effectiveDate),
      req.user.id,
    );
  }

  @Put(':id/transfer')
  @RequirePermissions('employees:transfer')
  async transferEmployee(
    @Param('id') userId: string,
    @Body()
    body: {
      newDepartmentId?: string;
      newBranchId?: string;
      effectiveDate: string;
    },
    @Request() req: any,
  ) {
    return this.employmentService.transferEmployee({
      userId,
      newDepartmentId: body.newDepartmentId,
      newBranchId: body.newBranchId,
      effectiveDate: new Date(body.effectiveDate),
      updatedById: req.user.id,
    });
  }

  @Get(':id/rehire-eligibility')
  @RequirePermissions('employees:read')
  async checkRehireEligibility(@Param('id') userId: string) {
    return this.employmentService.checkRehireEligibility(userId);
  }

  @Post(':id/rehire')
  @RequirePermissions('employees:rehire')
  async rehireEmployee(
    @Param('id') userId: string,
    @Body()
    body: {
      hireDate: string;
      jobTitle: string;
      departmentId: string;
      branchId: string;
      contractType: string;
      salary?: number;
    },
    @Request() req: any,
  ) {
    return this.employmentService.rehireEmployee({
      userId,
      hireDate: new Date(body.hireDate),
      jobTitle: body.jobTitle,
      departmentId: body.departmentId,
      branchId: body.branchId,
      contractType: body.contractType as any,
      salary: body.salary,
      createdById: req.user.id,
    });
  }

  // Guarantor endpoints
  @Get('employment/:employmentPeriodId/guarantors')
  async getGuarantors(
    @Param('employmentPeriodId') employmentPeriodId: string,
    @Request() req: any,
  ) {
    // Users can view their own guarantors, HR can view anyone's
    const employment = await this.employmentService.getEmploymentPeriodById(employmentPeriodId);
    const isOwnData = employment && req.user.id === employment.userId;
    const hasPermission = req.user.permissions?.includes('employees:read');
    
    if (!isOwnData && !hasPermission) {
      throw new ForbiddenException('Insufficient permissions to view this employment history');
    }
    
    return this.employmentService.getGuarantors(employmentPeriodId);
  }

  @Post('employment/:employmentPeriodId/guarantors')
  async createGuarantor(
    @Param('employmentPeriodId') employmentPeriodId: string,
    @Body()
    body: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      relationship: string;
      address?: string;
      occupation?: string;
    },
    @Request() req: any,
  ) {
    // Users can add guarantors to their own employment, HR can add to anyone's
    const employment = await this.employmentService.getEmploymentPeriodById(employmentPeriodId);
    const isOwnData = employment && req.user.id === employment.userId;
    const hasPermission = req.user.permissions?.includes('employees:create');
    
    if (!isOwnData && !hasPermission) {
      throw new ForbiddenException('Insufficient permissions to view this employment history');
    }
    
    return this.employmentService.createGuarantor({
      employmentPeriodId,
      ...body,
    });
  }

  @Put('guarantors/:guarantorId')
  async updateGuarantor(
    @Param('guarantorId') guarantorId: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      relationship?: string;
      address?: string;
      occupation?: string;
    },
    @Request() req: any,
  ) {
    // Users can update their own guarantors, HR can update anyone's
    const guarantor = await this.employmentService.getGuarantorById(guarantorId);
    if (guarantor && guarantor.employmentPeriod) {
      const isOwnData = req.user.id === (guarantor.employmentPeriod as any).userId;
      const hasPermission = req.user.permissions?.includes('employees:update');
      
      if (!isOwnData && !hasPermission) {
        throw new Error('Insufficient permissions');
      }
    }
    
    return this.employmentService.updateGuarantor(guarantorId, body);
  }

  // Next of Kin endpoints
  @Get('employment/:employmentPeriodId/next-of-kin')
  async getNextOfKin(
    @Param('employmentPeriodId') employmentPeriodId: string,
    @Request() req: any,
  ) {
    // Users can view their own next of kin, HR can view anyone's
    const employment = await this.employmentService.getEmploymentPeriodById(employmentPeriodId);
    const isOwnData = employment && req.user.id === employment.userId;
    const hasPermission = req.user.permissions?.includes('employees:read');
    
    if (!isOwnData && !hasPermission) {
      throw new ForbiddenException('Insufficient permissions to view this employment history');
    }
    
    return this.employmentService.getNextOfKin(employmentPeriodId);
  }

  @Post('employment/:employmentPeriodId/next-of-kin')
  async createNextOfKin(
    @Param('employmentPeriodId') employmentPeriodId: string,
    @Body()
    body: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      relationship: string;
      address?: string;
      isPrimary?: boolean;
    },
    @Request() req: any,
  ) {
    // Users can add next of kin to their own employment, HR can add to anyone's
    const employment = await this.employmentService.getEmploymentPeriodById(employmentPeriodId);
    const isOwnData = employment && req.user.id === employment.userId;
    const hasPermission = req.user.permissions?.includes('employees:create');
    
    if (!isOwnData && !hasPermission) {
      throw new ForbiddenException('Insufficient permissions to view this employment history');
    }
    
    return this.employmentService.createNextOfKin({
      employmentPeriodId,
      ...body,
    });
  }

  @Put('next-of-kin/:nextOfKinId')
  async updateNextOfKin(
    @Param('nextOfKinId') nextOfKinId: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      relationship?: string;
      address?: string;
      isPrimary?: boolean;
    },
    @Request() req: any,
  ) {
    // Users can update their own next of kin, HR can update anyone's
    const nextOfKin = await this.employmentService.getNextOfKinById(nextOfKinId);
    if (nextOfKin && nextOfKin.employmentPeriod) {
      const isOwnData = req.user.id === (nextOfKin.employmentPeriod as any).userId;
      const hasPermission = req.user.permissions?.includes('employees:update');
      
      if (!isOwnData && !hasPermission) {
        throw new Error('Insufficient permissions');
      }
    }
    
    return this.employmentService.updateNextOfKin(nextOfKinId, body);
  }

  // Submission workflow endpoints
  @Post(':id/submit')
  @RequirePermissions('employees:submit')
  async submitForReview(@Param('id') userId: string) {
    return this.employmentService.submitEmploymentForReview(userId);
  }

  @Get('pending-submissions')
  @RequirePermissions('employees:review')
  async getPendingSubmissions() {
    return this.employmentService.getPendingSubmissions();
  }

  @Post(':id/approve')
  @RequirePermissions('employees:approve')
  async approveEmployment(
    @Param('id') userId: string,
    @Body() body: { reviewNotes?: string },
    @Request() req: any,
  ) {
    return this.employmentService.approveEmployment(userId, req.user.id, body.reviewNotes);
  }

  @Post(':id/reject')
  @RequirePermissions('employees:reject')
  async rejectEmployment(
    @Param('id') userId: string,
    @Body() body: { reviewNotes: string },
    @Request() req: any,
  ) {
    return this.employmentService.rejectEmployment(userId, req.user.id, body.reviewNotes);
  }

  @Post(':id/request-revision')
  @RequirePermissions('employees:review')
  async requestRevision(
    @Param('id') userId: string,
    @Body() body: { reviewNotes: string },
    @Request() req: any,
  ) {
    return this.employmentService.requestRevision(userId, req.user.id, body.reviewNotes);
  }

  @Post(':id/grant-edit')
  @RequirePermissions('employees:grant_edit')
  async grantEditRights(@Param('id') userId: string, @Request() req: any) {
    return this.employmentService.grantEditRights(userId, req.user.id);
  }

  @Post(':id/revoke-edit')
  @RequirePermissions('employees:grant_edit')
  async revokeEditRights(@Param('id') userId: string, @Request() req: any) {
    return this.employmentService.revokeEditRights(userId, req.user.id);
  }

  @Get(':id/can-edit')
  @RequirePermissions('dashboard:read')
  async canEdit(@Param('id') userId: string) {
    const canEdit = await this.employmentService.canEditEmployment(userId);
    return { canEdit };
  }
}
