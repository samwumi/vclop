import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { UserStatus, Gender } from '@prisma/client';

@Exclude()
export class UserResponseDto {
  @Expose() @ApiProperty() id!: string;
  @Expose() @ApiPropertyOptional() employeeId!: string | null;
  @Expose() @ApiProperty() email!: string;
  @Expose() @ApiPropertyOptional() phone!: string | null;
  @Expose() @ApiProperty() username!: string;
  @Expose() @ApiProperty() firstName!: string;
  @Expose() @ApiPropertyOptional() middleName!: string | null;
  @Expose() @ApiProperty() lastName!: string;
  @Expose() @ApiPropertyOptional() suffix!: string | null;
  @Expose() @ApiPropertyOptional({ enum: Gender }) gender!: Gender | null;
  @Expose() @ApiPropertyOptional() dateOfBirth!: Date | null;
  @Expose() @ApiPropertyOptional() avatarPath!: string | null;
  @Expose() @ApiProperty({ enum: UserStatus }) status!: UserStatus;
  @Expose() @ApiPropertyOptional() branchId!: string | null;
  @Expose() @ApiPropertyOptional() departmentId!: string | null;
  @Expose() @ApiPropertyOptional() supervisorId!: string | null;
  @Expose() @ApiPropertyOptional() jobTitle!: string | null;
  @Expose() @ApiPropertyOptional() emailVerifiedAt!: Date | null;
  @Expose() @ApiPropertyOptional() lastLoginAt!: Date | null;
  @Expose() @ApiProperty() mustChangePassword!: boolean;
  @Expose() @ApiProperty() twoFactorEnabled!: boolean;
  @Expose() @ApiProperty() timezone!: string;
  @Expose() @ApiProperty() locale!: string;
  @Expose() @ApiProperty() createdAt!: Date;
  @Expose() @ApiProperty() updatedAt!: Date;

  // Populated in relations
  @Expose() @ApiPropertyOptional() branch?: { id: string; name: string; code: string } | null;
  @Expose() @ApiPropertyOptional() department?: { id: string; name: string; code: string } | null;
  @Expose() @ApiPropertyOptional() roles?: Array<{ id: string; name: string; code: string }>;
}
