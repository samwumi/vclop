import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@vclop.local', description: 'Email or username' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  login!: string;

  @ApiProperty({ example: 'Admin@12345!', description: 'Password' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  password!: string;
}
