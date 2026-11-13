import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectLoanDto {
  @ApiProperty({ description: 'Reason for rejection' })
  @IsNotEmpty()
  @IsString()
  reason!: string;
}
