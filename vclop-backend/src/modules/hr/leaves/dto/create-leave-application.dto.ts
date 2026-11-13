import { IsNotEmpty, IsString, IsDate, IsEnum, IsOptional, MinDate } from 'class-validator';
import { Type } from 'class-transformer';
import { DayType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaveApplicationDto {
  @ApiProperty({ description: 'Leave type ID' })
  @IsNotEmpty()
  @IsString()
  leaveTypeId!: string;

  @ApiProperty({ description: 'Leave start date', example: '2026-11-01' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  @MinDate(new Date())
  startDate!: Date;

  @ApiProperty({ description: 'Leave end date', example: '2026-11-05' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate!: Date;

  @ApiPropertyOptional({ enum: DayType, default: 'FULL_DAY' })
  @IsOptional()
  @IsEnum(DayType)
  startDayType?: DayType;

  @ApiPropertyOptional({ enum: DayType, default: 'FULL_DAY' })
  @IsOptional()
  @IsEnum(DayType)
  endDayType?: DayType;

  @ApiProperty({ description: 'Reason for leave' })
  @IsNotEmpty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ description: 'Handover notes for responsibilities' })
  @IsOptional()
  @IsString()
  handoverNotes?: string;

  @ApiPropertyOptional({ description: 'Emergency contact name' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ description: 'Emergency contact phone' })
  @IsOptional()
  @IsString()
  emergencyPhone?: string;
}
