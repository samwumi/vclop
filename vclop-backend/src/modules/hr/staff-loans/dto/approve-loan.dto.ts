import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveLoanDto {
  @ApiProperty({ description: 'Approved loan amount', example: 450000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1000)
  approvedAmount!: number;

  @ApiProperty({ description: 'Approved tenure in months', example: 12 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(60)
  approvedTenureMonths!: number;

  @ApiProperty({ description: 'Interest rate (%)', example: 5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate!: number;

  @ApiPropertyOptional({ description: 'Approval notes' })
  @IsOptional()
  @IsString()
  approvalNotes?: string;
}
