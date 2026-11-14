import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
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
  @RequirePermissions('employees:read')
  async getEmploymentHistory(
    @Param('id') userId: string,
    @Request() req: any,
  ) {
    return this.employmentService.getEmploymentHistory(userId);
  }

  @Get(':id/current-employment')
  @RequirePermissions('employees:read')
  async getCurrentEmployment(@Param('id') userId: string) {
    return this.employmentService.getCurrentEmployment(userId);
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
  @RequirePermissions('employees:read')
  async getGuarantors(@Param('employmentPeriodId') employmentPeriodId: string) {
    return this.employmentService.getGuarantors(employmentPeriodId);
  }

  @Post('employment/:employmentPeriodId/guarantors')
  @RequirePermissions('employees:create')
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
  ) {
    return this.employmentService.createGuarantor({
      employmentPeriodId,
      ...body,
    });
  }

  @Put('guarantors/:guarantorId')
  @RequirePermissions('employees:update')
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
  ) {
    return this.employmentService.updateGuarantor(guarantorId, body);
  }

  // Next of Kin endpoints
  @Get('employment/:employmentPeriodId/next-of-kin')
  @RequirePermissions('employees:read')
  async getNextOfKin(@Param('employmentPeriodId') employmentPeriodId: string) {
    return this.employmentService.getNextOfKin(employmentPeriodId);
  }

  @Post('employment/:employmentPeriodId/next-of-kin')
  @RequirePermissions('employees:create')
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
  ) {
    return this.employmentService.createNextOfKin({
      employmentPeriodId,
      ...body,
    });
  }

  @Put('next-of-kin/:nextOfKinId')
  @RequirePermissions('employees:update')
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
  ) {
    return this.employmentService.updateNextOfKin(nextOfKinId, body);
  }
}
