import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordWithOtpDto {
  @ApiProperty({
    description: 'Current password',
    example: 'OldP@ssw0rd',
  })
  @IsString()
  currentPassword!: string;

  @ApiProperty({
    description: 'New password (min 8 chars, must include uppercase, lowercase, number, special char)',
    example: 'NewP@ssw0rd123',
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;

  @ApiProperty({
    description: '6-digit OTP code received via email',
    example: '123456',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  @Matches(/^\d{6}$/, { message: 'OTP code must be exactly 6 digits' })
  otpCode!: string;
}
