import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Reset token from email' })
  @IsNotEmpty()
  @IsString()
  token!: string;

  @ApiProperty({ description: 'New password', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  newPassword!: string;
}
