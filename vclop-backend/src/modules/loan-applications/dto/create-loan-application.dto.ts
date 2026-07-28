import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateLoanApplicationDto {
  @ApiProperty()
  @IsUUID()
  customerId!: string;

  @ApiProperty()
  @IsUUID()
  loanProductId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(3650)
  tenureDays!: number;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  purpose?: string;
}
