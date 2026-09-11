import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormEntityType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFormTemplateDto {
  @ApiProperty({ enum: FormEntityType })
  @IsEnum(FormEntityType)
  entityType!: FormEntityType;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ maxLength: 150 })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Mark this as the default template used for its entityType' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
