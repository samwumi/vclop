import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ActivityType, ContactMethod, ContactOutcome } from '@prisma/client';

export class CreateRecoveryActivityDto {
  @ApiProperty()
  @IsUUID()
  accountId!: string;

  @ApiProperty({ enum: ActivityType })
  @IsEnum(ActivityType)
  activityType!: ActivityType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  activityDate?: string;

  @ApiPropertyOptional({ enum: ContactMethod })
  @IsOptional()
  @IsEnum(ContactMethod)
  contactMethod?: ContactMethod;

  @ApiPropertyOptional({ enum: ContactOutcome })
  @IsOptional()
  @IsEnum(ContactOutcome)
  contactOutcome?: ContactOutcome;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextFollowupDate?: string;

  @ApiPropertyOptional({ description: 'Latitude for field visits' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude for field visits' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  visitAddress?: string;
}
