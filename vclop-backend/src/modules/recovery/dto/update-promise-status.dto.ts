import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { PromiseStatus } from '@prisma/client';

export class UpdatePromiseStatusDto {
  @ApiProperty({ enum: PromiseStatus })
  @IsEnum(PromiseStatus)
  status!: PromiseStatus;

  @ApiPropertyOptional({ description: 'Actual amount paid (for KEPT or PARTIAL)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualPaidAmount?: number;

  @ApiPropertyOptional({ description: 'When payment was actually made' })
  @IsOptional()
  @IsDateString()
  actualPaidDate?: string;
}
