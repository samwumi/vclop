import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString,
  Matches, Max, MaxLength, Min, MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBranchDto {
  @ApiProperty({ example: 'BR-002' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  @Matches(/^[A-Z0-9_-]+$/)
  code!: string;

  @ApiProperty({ example: 'Makati Branch' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) state?: string;
  @ApiPropertyOptional({ default: 'Philippines' }) @IsOptional() @IsString() @MaxLength(100) country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) postalCode?: string;

  @ApiPropertyOptional({ description: 'Latitude (-90 to 90)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude (-180 to 180)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() @MaxLength(150) email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) managerName?: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isHeadOffice?: boolean;
}
