import { ApiPropertyOptional } from '@nestjs/swagger';
import { LoanApplicationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryLoanApplicationsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: LoanApplicationStatus })
  @IsOptional()
  @IsEnum(LoanApplicationStatus)
  status?: LoanApplicationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  loanProductId?: string;
}
