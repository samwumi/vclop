import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CustomerType, DocumentStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDocumentTypeDto {
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

  @ApiPropertyOptional({ enum: CustomerType, description: 'Omit to apply to both individual and business customers' })
  @IsOptional()
  @IsEnum(CustomerType)
  appliesTo?: CustomerType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRequiredDefault?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  expiryApplicable?: boolean;
}

export class UpdateDocumentTypeDto extends PartialType(CreateDocumentTypeDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class VerifyDocumentDto {
  @ApiProperty({ enum: DocumentStatus, description: 'Must be VERIFIED or REJECTED' })
  @IsEnum(DocumentStatus)
  status!: DocumentStatus;

  @ApiPropertyOptional({ maxLength: 500, description: 'Required when status is REJECTED' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}
