import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export enum ReviewDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class ReviewLoanApplicationDto {
  @ApiProperty({ enum: ReviewDecision })
  @IsEnum(ReviewDecision)
  decision!: ReviewDecision;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNotes?: string;

  @ApiPropertyOptional({ maxLength: 500, description: 'Required when decision is REJECTED' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

export class RecordRepaymentDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ default: 'MANUAL' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  method?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
