import { IsNotEmpty, IsString, IsDate, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDelegationDto {
  @ApiProperty({ enum: ResourceType, description: 'Resource type' })
  @IsNotEmpty()
  @IsEnum(ResourceType)
  resourceType!: ResourceType;

  @ApiProperty({ description: 'Resource ID (customer ID, loan ID, etc.)' })
  @IsNotEmpty()
  @IsString()
  resourceId!: string;

  @ApiProperty({ description: 'User ID to delegate to' })
  @IsNotEmpty()
  @IsString()
  delegatedTo!: string;

  @ApiProperty({ description: 'Effective from date', example: '2026-11-15' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  effectiveFrom!: Date;

  @ApiProperty({ description: 'Effective to date', example: '2026-11-19' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  effectiveTo!: Date;

  @ApiProperty({ description: 'Reason for delegation' })
  @IsNotEmpty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ description: 'Related leave application ID' })
  @IsOptional()
  @IsString()
  relatedLeaveId?: string;

  @ApiPropertyOptional({ description: 'Can read', default: true })
  @IsOptional()
  @IsBoolean()
  canRead?: boolean;

  @ApiPropertyOptional({ description: 'Can update', default: false })
  @IsOptional()
  @IsBoolean()
  canUpdate?: boolean;

  @ApiPropertyOptional({ description: 'Can approve loans', default: false })
  @IsOptional()
  @IsBoolean()
  canApproveLoans?: boolean;

  @ApiPropertyOptional({ description: 'Can disburse', default: false })
  @IsOptional()
  @IsBoolean()
  canDisburse?: boolean;

  @ApiPropertyOptional({ description: 'Can collect', default: false })
  @IsOptional()
  @IsBoolean()
  canCollect?: boolean;
}
