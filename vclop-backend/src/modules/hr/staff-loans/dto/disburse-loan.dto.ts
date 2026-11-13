import { IsNotEmpty, IsDate, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DisburseLoanDto {
  @ApiProperty({ description: 'Disbursement date', example: '2026-10-28' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  disbursementDate!: Date;

  @ApiProperty({ description: 'Disbursement method', example: 'Bank Transfer' })
  @IsNotEmpty()
  @IsString()
  disbursementMethod!: string;

  @ApiPropertyOptional({ description: 'Reference number' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
