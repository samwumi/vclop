import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordChangeOtpDto {
  @ApiProperty({
    description: 'Email address to send OTP to',
    example: 'user@verticalcapital.ng',
  })
  @IsEmail()
  email!: string;
}
