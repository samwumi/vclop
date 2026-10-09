import { IsDecimal, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SetTargetDto {
  @ApiProperty({ description: 'Officer user ID' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'Target month in YYYY-MM format', example: '2026-10' })
  @IsString()
  @IsNotEmpty()
  targetMonth!: string;

  @ApiProperty({ description: 'Disbursement target amount', example: 5000000 })
  @IsDecimal()
  @Type(() => Number)
  @Min(0)
  disbursementTarget!: number;

  @ApiProperty({ description: 'Customer acquisition target', example: 20 })
  @IsInt()
  @Type(() => Number)
  @Min(0)
  customerTarget!: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryTargetsDto {
  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by month (YYYY-MM)' })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
