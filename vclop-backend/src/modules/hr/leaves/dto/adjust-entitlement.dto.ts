import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustEntitlementDto {
  @ApiProperty({ description: 'Adjustment amount in days (can be negative)', example: 5 })
  @IsNumber()
  adjustmentDays: number;

  @ApiProperty({ description: 'Reason for adjustment', example: 'Carry-forward from previous year' })
  @IsString()
  reason: string;
}

export class UpdateEntitlementDto {
  @ApiProperty({ description: 'Allocated days', example: 21, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  allocatedDays?: number;

  @ApiProperty({ description: 'Carry forward days', example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  carryForwardDays?: number;

  @ApiProperty({ description: 'Adjustment days', example: 3, required: false })
  @IsOptional()
  @IsNumber()
  adjustmentDays?: number;

  @ApiProperty({ description: 'Reason for update', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
