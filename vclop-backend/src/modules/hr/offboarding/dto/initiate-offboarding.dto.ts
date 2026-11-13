import { IsNotEmpty, IsString, IsDate, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitiateOffboardingDto {
  @ApiProperty({ description: 'User ID of employee exiting' })
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'Exit date', example: '2026-12-31' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  exitDate!: Date;

  @ApiProperty({ description: 'Reason for exit' })
  @IsNotEmpty()
  @IsString()
  exitReason!: string;

  @ApiProperty({ description: 'Is voluntary resignation', example: true })
  @IsNotEmpty()
  @IsBoolean()
  isVoluntary!: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
