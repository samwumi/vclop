import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSettingDto {
  @ApiProperty({ description: 'New value (send null to revert to default)' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  value?: string | null;
}

export class BulkUpdateSettingDto {
  @ApiProperty({ example: 'company.name' })
  @IsNotEmpty()
  @IsString()
  key!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  value?: string | null;
}

export class BulkUpdateSettingsDto {
  @ApiProperty({ type: [BulkUpdateSettingDto] })
  settings!: BulkUpdateSettingDto[];
}
