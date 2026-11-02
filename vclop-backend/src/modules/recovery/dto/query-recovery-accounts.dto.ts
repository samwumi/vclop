import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { RecoverySource, RecoveryStatus, PriorityLevel } from '@prisma/client';

export class QueryRecoveryAccountsDto {
  @ApiPropertyOptional({ enum: RecoverySource })
  @IsOptional()
  @IsEnum(RecoverySource)
  source?: RecoverySource;

  @ApiPropertyOptional({ enum: RecoveryStatus })
  @IsOptional()
  @IsEnum(RecoveryStatus)
  status?: RecoveryStatus;

  @ApiPropertyOptional({ enum: PriorityLevel })
  @IsOptional()
  @IsEnum(PriorityLevel)
  priorityLevel?: PriorityLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedOfficerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
