import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class AddGuarantorDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ maxLength: 20 })
  @IsString()
  @Matches(/^\+?\d{10,14}$/, { message: 'phone must be a valid phone number' })
  phone!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  relationship?: string;
}

export class AddCollateralDto {
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number;
}
