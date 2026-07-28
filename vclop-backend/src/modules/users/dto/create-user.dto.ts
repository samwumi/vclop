import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString,
  IsUUID, MaxLength, MinLength, IsDateString, Matches,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'EMP-0002' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  employeeId?: string;

  @ApiProperty({ example: 'jane@vclop.local' })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @ApiPropertyOptional({ example: '+63912345678' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ example: 'jane.doe' })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9._-]+$/, { message: 'Username may only contain lowercase letters, numbers, dots, hyphens and underscores' })
  username!: string;

  @ApiProperty({ example: 'SecureP@ss1!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password!: string;

  @ApiProperty({ example: 'Jane' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  firstName!: string;

  @ApiPropertyOptional({ example: 'Marie' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  middleName?: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  lastName!: string;

  @ApiPropertyOptional({ example: 'Jr.' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  suffix?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Branch UUID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Department UUID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Supervisor user UUID' })
  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @ApiPropertyOptional({ example: 'Loan Officer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string;

  @ApiPropertyOptional({ description: 'Role UUIDs to assign' })
  @IsOptional()
  @IsUUID('4', { each: true })
  roleIds?: string[];

  @ApiPropertyOptional({ description: 'Send email verification on create', default: true })
  @IsOptional()
  sendVerificationEmail?: boolean;
}
