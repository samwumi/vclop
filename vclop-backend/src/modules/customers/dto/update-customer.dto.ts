import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CustomerStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateCustomerDto } from './create-customer.dto';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}

export class UpdateCustomerStatusDto {
  @ApiPropertyOptional({ enum: CustomerStatus })
  @IsEnum(CustomerStatus)
  status!: CustomerStatus;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
