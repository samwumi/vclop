import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'true to verify, false to reject' })
  @IsBoolean()
  approved!: boolean;

  @ApiPropertyOptional({ description: 'Required when rejecting' })
  @IsOptional()
  @IsString()
  notes?: string;
}
