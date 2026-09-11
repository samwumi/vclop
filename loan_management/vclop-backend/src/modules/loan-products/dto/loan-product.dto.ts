import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { InterestType, RepaymentFrequency } from '@prisma/client';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateLoanProductDto {
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ maxLength: 150 })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  minAmount!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  maxAmount!: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  minTenureDays!: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  maxTenureDays!: number;

  @ApiProperty({ enum: InterestType })
  @IsEnum(InterestType)
  interestType!: InterestType;

  @ApiProperty({ description: 'Flat percentage rate for the full tenure, e.g. 15 for 15%' })
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate!: number;

  @ApiProperty({ enum: RepaymentFrequency })
  @IsEnum(RepaymentFrequency)
  repaymentFrequency!: RepaymentFrequency;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gracePeriodDays?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lateFeeAmount?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  penaltyRate?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  processingFeeRate?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  insuranceRate?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresGuarantor?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresCollateral?: boolean;

  @ApiPropertyOptional({ description: 'DocumentType ids required for this product', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  requiredDocumentTypeIds?: string[];
}

export class UpdateLoanProductDto extends PartialType(CreateLoanProductDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
