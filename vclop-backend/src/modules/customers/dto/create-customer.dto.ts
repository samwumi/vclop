import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType, Gender } from '@prisma/client';
import { IsBoolean, IsDateString, IsEmail, IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @ApiPropertyOptional({ enum: CustomerType, default: CustomerType.INDIVIDUAL })
  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @ApiPropertyOptional({ maxLength: 200, description: 'Required when type is BUSINESS' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessName?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ maxLength: 20 })
  @IsString()
  @Matches(/^\+?\d{10,14}$/, { message: 'phone must be a valid phone number' })
  phone!: string;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @Matches(/^\+?\d{10,14}$/, { message: 'alternatePhone must be a valid phone number' })
  alternatePhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: '11-digit Bank Verification Number - REQUIRED' })
  @IsString()
  @Matches(/^\d{11}$/, { message: 'bvn must be 11 digits' })
  bvn!: string;

  @ApiProperty({ description: '11-digit National Identification Number - REQUIRED' })
  @IsString()
  @Matches(/^\d{11}$/, { message: 'nin must be 11 digits' })
  nin!: string;

  @ApiPropertyOptional({ description: "Customer's bank account number (10 digits) — used for Paystack BVN validation", maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  bankAccountNumber?: string;

  @ApiPropertyOptional({ description: "Customer's bank CBN code (3 digits, e.g. 044 for Access Bank)", maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  bankCode?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  residentialAddress?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  businessAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  gpsLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  gpsLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedOfficerId?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  employerName?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employmentType?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  monthlyIncome?: number;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  employerPhone?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  employerAddress?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nokName?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nokRelationship?: string;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  nokPhone?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  nokAddress?: string;

  // NDPA Consent Fields
  @ApiProperty({ description: 'Customer consents to data processing in line with NDPA - REQUIRED' })
  @IsBoolean()
  dataProcessingConsent!: boolean;

  @ApiPropertyOptional({ description: 'Customer consents to marketing communications' })
  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;

  @ApiProperty({ description: 'Customer consents to credit bureau check - REQUIRED' })
  @IsBoolean()
  creditBureauConsent!: boolean;

  @ApiPropertyOptional({ description: 'Customer consents to third-party data sharing' })
  @IsOptional()
  @IsBoolean()
  thirdPartyDataSharingConsent?: boolean;
}
