import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail, IsEnum, IsOptional, IsString,
  IsUUID, MaxLength, IsDateString, IsBoolean,
} from 'class-validator';
import { Gender, UserStatus } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) employeeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() @MaxLength(150) email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) middleName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) suffix?: string;
  @ApiPropertyOptional({ enum: Gender }) @IsOptional() @IsEnum(Gender) gender?: Gender;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() supervisorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) jobTitle?: string;
  @ApiPropertyOptional({ enum: UserStatus }) @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() mustChangePassword?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10) locale?: string;
}
