import { IsNotEmpty, IsBoolean, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProcessClearanceDto {
  @ApiProperty({ description: 'Is cleared', example: true })
  @IsNotEmpty()
  @IsBoolean()
  isCleared!: boolean;

  @ApiPropertyOptional({ description: 'Clearance notes' })
  @IsOptional()
  @IsString()
  clearanceNotes?: string;
}

export class ProcessFinanceClearanceDto extends ProcessClearanceDto {
  @ApiPropertyOptional({ description: 'Outstanding amount', example: 50000 })
  @IsOptional()
  @IsNumber()
  outstandingAmount?: number;
}

export class ProcessAssetClearanceDto extends ProcessClearanceDto {
  @ApiPropertyOptional({ description: 'Outstanding items' })
  @IsOptional()
  @IsString()
  outstandingItems?: string;
}

export class ProcessHRClearanceDto extends ProcessClearanceDto {
  @ApiPropertyOptional({ description: 'Exit interview completed', example: true })
  @IsOptional()
  @IsBoolean()
  exitInterviewCompleted?: boolean;
}

export class RevokeITAccessDto {
  @ApiPropertyOptional({ description: 'Revocation notes' })
  @IsOptional()
  @IsString()
  revocationNotes?: string;

  @ApiPropertyOptional({ description: 'Accounts disabled', type: [String] })
  @IsOptional()
  accountsDisabled?: string[];

  @ApiPropertyOptional({ description: 'Session terminated', example: true })
  @IsOptional()
  @IsBoolean()
  sessionTerminated?: boolean;
}
