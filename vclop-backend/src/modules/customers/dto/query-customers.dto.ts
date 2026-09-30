import { ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryCustomersDto extends PaginationDto {
  @ApiPropertyOptional({ enum: CustomerStatus })
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter to customers registered by a specific officer' })
  @IsOptional()
  @IsUUID()
  assignedOfficerId?: string;
}
