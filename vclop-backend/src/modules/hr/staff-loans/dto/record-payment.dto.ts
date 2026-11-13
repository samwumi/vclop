import { IsNotEmpty, IsNumber, IsDate, IsString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordPaymentDto {
  @ApiProperty({ description: 'Payment amount', example: 50000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ description: 'Payment date', example: '2026-10-28' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  paymentDate!: Date;

  @ApiProperty({ description: 'Payment method', example: 'Salary Deduction' })
  @IsNotEmpty()
  @IsString()
  paymentMethod!: string;

  @ApiPropertyOptional({ description: 'Reference number' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
