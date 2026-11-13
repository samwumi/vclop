import { IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum TransactionType {
  ALL = 'ALL',
  VIRTUAL_ACCOUNT = 'VIRTUAL_ACCOUNT',
  MANUAL = 'MANUAL',
}

export enum TransactionStatus {
  ALL = 'ALL',
  MATCHED = 'MATCHED',
  UNMATCHED = 'UNMATCHED',
  PENDING = 'PENDING',
}

export class TransactionQueryDto {
  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: TransactionType, default: TransactionType.ALL })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ enum: TransactionStatus, default: TransactionStatus.ALL })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'Search by customer name, loan number, or account number' })
  @IsOptional()
  @IsString()
  search?: string;
}
