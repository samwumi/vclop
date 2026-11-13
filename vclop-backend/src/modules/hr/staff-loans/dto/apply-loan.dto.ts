import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyLoanDto {
  @ApiProperty({ description: 'Purpose of the loan' })
  @IsNotEmpty()
  @IsString()
  loanPurpose!: string;

  @ApiProperty({ description: 'Requested loan amount', example: 500000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1000)
  requestedAmount!: number;

  @ApiProperty({ description: 'Proposed tenure in months', example: 12 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(60)
  proposedTenureMonths!: number;

  @ApiProperty({ description: 'Justification for the loan' })
  @IsNotEmpty()
  @IsString()
  justification!: string;
}
