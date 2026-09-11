import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateFormTemplateDto } from './create-form-template.dto';

// entityType is immutable after creation — clone the template instead of
// re-pointing it at a different entity type.
export class UpdateFormTemplateDto extends PartialType(
  OmitType(CreateFormTemplateDto, ['entityType'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
