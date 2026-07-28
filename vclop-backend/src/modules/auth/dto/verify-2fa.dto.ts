import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class Verify2faDto {
  @ApiProperty({ description: '6-digit TOTP code', example: '123456' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code!: string;
}
