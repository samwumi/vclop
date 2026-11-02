import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRecoveryAccountDto } from './create-recovery-account.dto';

export class ImportRecoveryAccountsDto {
  @ApiProperty({ type: [CreateRecoveryAccountDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecoveryAccountDto)
  accounts!: CreateRecoveryAccountDto[];
}
