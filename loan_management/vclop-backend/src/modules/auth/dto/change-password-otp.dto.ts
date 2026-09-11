import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches, Length } from 'class-validator';

export class ChangePasswordWithOtpDto {
  @ApiProperty({
    description: '6-digit OTP received via email',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
  otp!: string;

  @ApiProperty({
    description: 'New password (min 8 chars, must include uppercase, number, and symbol)',
    example: 'NewSecure@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword!: string;
}
