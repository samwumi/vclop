import { ApiPropertyOptional } from '@nestjs/swagger';
import { FormEntityType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryFormTemplatesDto extends PaginationDto {
  @ApiPropertyOptional({ enum: FormEntityType })
  @IsOptional()
  @IsEnum(FormEntityType)
  entityType?: FormEntityType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  withInactive?: boolean;
}
