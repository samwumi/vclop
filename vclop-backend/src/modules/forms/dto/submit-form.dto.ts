import { ApiProperty } from '@nestjs/swagger';
import { FormEntityType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsUUID, ValidateNested } from 'class-validator';

class FieldValueDto {
  @ApiProperty()
  @IsUUID()
  fieldId!: string;

  @ApiProperty({ description: 'Value — shape depends on the field type' })
  @IsOptional()
  value!: unknown;
}

export class SubmitFormDto {
  @ApiProperty()
  @IsUUID()
  formTemplateId!: string;

  @ApiProperty({ enum: FormEntityType })
  @IsEnum(FormEntityType)
  entityType!: FormEntityType;

  @ApiProperty({ description: 'ID of the Customer / Loan Application / Guarantor / Collateral record this data belongs to' })
  @IsUUID()
  entityId!: string;

  @ApiProperty({ type: [FieldValueDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FieldValueDto)
  values!: FieldValueDto[];
}