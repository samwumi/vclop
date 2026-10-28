import { ApiPropertyOptional } from '@nestjs/swagger';
import { LoanApplicationStatus, LoanStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryLoanApplicationsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: LoanApplicationStatus })
  @IsOptional()
  @IsEnum(LoanApplicationStatus)
  status?: LoanApplicationStatus;

  @ApiPropertyOptional({ enum: LoanStatus, description: 'Filter by actual loan status (ACTIVE, COMPLETED, etc.) - only applies to disbursed loans' })
  @IsOptional()
  @IsEnum(LoanStatus)
  loanStatus?: LoanStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  loanProductId?: string;

  @ApiPropertyOptional({ description: 'Filter to a specific loan officer (submittedById)' })
  @IsOptional()
  @IsUUID()
  submittedById?: string;

  @ApiPropertyOptional({ description: 'Filter to applications in a specific branch (via customer branchId)' })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
