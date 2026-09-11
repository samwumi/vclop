import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { FormFieldType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateFormFieldDto {
  @ApiProperty({ maxLength: 100, description: 'Stable machine key, unique within the section (e.g. "bvn_number")' })
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9_]+$/, { message: 'code must be lowercase snake_case (letters, numbers, underscores)' })
  code!: string;

  @ApiProperty({ maxLength: 150 })
  @IsString()
  @MaxLength(150)
  label!: string;

  @ApiProperty({ enum: FormFieldType })
  @IsEnum(FormFieldType)
  type!: FormFieldType;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  placeholder?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  helpText?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: 'Default value — shape depends on field type' })
  @IsOptional()
  defaultValue?: unknown;

  @ApiPropertyOptional({
    description: 'For DROPDOWN / RADIO / MULTI_SELECT: [{ "label": "...", "value": "..." }]',
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  options?: Array<{ label: string; value: string }>;

  @ApiPropertyOptional({
    description: 'Extra validation rules, e.g. { "minLength": 10, "maxLength": 11, "regex": "^0[0-9]{10}$" }',
  })
  @IsOptional()
  @IsObject()
  validation?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Conditional visibility, e.g. { "fieldCode": "employment_type", "operator": "equals", "value": "EMPLOYED" }',
  })
  @IsOptional()
  @IsObject()
  visibilityRule?: Record<string, unknown>;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateFormFieldDto extends PartialType(CreateFormFieldDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class FieldMoveItemDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty({ description: 'Target section id — omit if only reordering within the same section' })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class MoveFieldsDto {
  @ApiProperty({ type: [FieldMoveItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FieldMoveItemDto)
  fields!: FieldMoveItemDto[];
}
