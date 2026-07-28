import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@vclop.local' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}
