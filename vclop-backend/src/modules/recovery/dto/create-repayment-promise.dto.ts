import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateRepaymentPromiseDto {
  @ApiProperty()
  @IsUUID()
  accountId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  promisedAmount!: number;

  @ApiProperty({ description: 'Date customer promised to pay' })
  @IsDateString()
  promisedDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  promiseNotes?: string;
}
