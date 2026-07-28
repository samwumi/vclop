import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional,
  IsString, IsUUID, Max, Min, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SaveLayoutItemDto {
  @ApiProperty() @IsUUID() widgetId!: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(0) posX!: number;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(0) posY!: number;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) @Max(12) width!: number;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) @Max(8) height!: number;
  @ApiPropertyOptional() @IsOptional() config?: Record<string, unknown>;
}

export class SaveLayoutDto {
  @ApiProperty() @IsNotEmpty() @IsString() @MaxLength(100) name!: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isDefault?: boolean;
  @ApiProperty({ type: [SaveLayoutItemDto] }) @IsArray() items!: SaveLayoutItemDto[];
}

export class UpdateLayoutDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
  @ApiPropertyOptional({ type: [SaveLayoutItemDto] }) @IsOptional() @IsArray() items?: SaveLayoutItemDto[];
}
