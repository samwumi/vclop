import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString,
  IsUUID, Matches, MaxLength,
} from 'class-validator';
import { SettingScope, SettingType } from '@prisma/client';

export class CreateSettingDto {
  @ApiProperty({ example: 'loan.default_interest_rate', description: 'Dot-notation key' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9._]+$/, { message: 'Key must be lowercase alphanumeric with dots only' })
  key!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  value?: string | null;

  @ApiProperty({ enum: SettingType, default: SettingType.STRING })
  @IsEnum(SettingType)
  type!: SettingType;

  @ApiProperty({ enum: SettingScope, default: SettingScope.SYSTEM })
  @IsEnum(SettingScope)
  scope!: SettingScope;

  @ApiPropertyOptional({ description: 'Branch UUID — required when scope is BRANCH' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty({ example: 'Default Interest Rate' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  label!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 'loan', description: 'Settings group for UI grouping' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  group!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isReadonly?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isEncrypted?: boolean;
}
