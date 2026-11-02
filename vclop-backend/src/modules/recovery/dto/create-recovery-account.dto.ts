import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecoverySource, PriorityLevel } from '@prisma/client';

export class CreateRecoveryAccountDto {
  @ApiProperty({ enum: RecoverySource })
  @IsEnum(RecoverySource)
  source!: RecoverySource;

  @ApiPropertyOptional({ description: 'Required if source is VCLOP' })
  @IsOptional()
  @IsUUID()
  vclopLoanId?: string;

  @ApiPropertyOptional({ description: 'Link to existing customer if available' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  customerName!: string;

  @ApiProperty({ maxLength: 20 })
  @IsString()
  @MaxLength(20)
  customerPhone!: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  customerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiProperty({ description: 'Original loan amount' })
  @IsNumber()
  @Min(0)
  originalPrincipal!: number;

  @ApiProperty({ description: 'When the loan was originally disbursed' })
  @IsDateString()
  disbursementDate!: string;

  @ApiPropertyOptional({ maxLength: 100, description: 'Legacy loan reference number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  originalReference?: string;

  @ApiProperty({ description: 'Amount already repaid before recovery started' })
  @IsNumber()
  @Min(0)
  historicalRepayments!: number;

  @ApiProperty({ description: 'Current outstanding balance' })
  @IsNumber()
  @Min(0)
  outstandingBalance!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedOfficerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: PriorityLevel })
  @IsOptional()
  @IsEnum(PriorityLevel)
  priorityLevel?: PriorityLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
