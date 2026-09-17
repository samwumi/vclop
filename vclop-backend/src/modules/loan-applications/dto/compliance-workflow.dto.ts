import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ComplianceDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REQUEST_CHANGES = 'REQUEST_CHANGES',
}

export class ComplianceReviewDto {
  @ApiProperty({ 
    enum: ComplianceDecision, 
    description: 'APPROVE moves to next stage, REJECT ends application, REQUEST_CHANGES returns to loan officer'
  })
  @IsEnum(ComplianceDecision)
  @IsNotEmpty()
  decision!: ComplianceDecision;

  @ApiProperty({ required: false, description: 'Reason for rejection or changes needed' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  feedback?: string;
}

export class ResubmitApplicationDto {
  @ApiProperty({ description: 'Notes from loan officer explaining what was fixed' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  resubmissionNotes!: string;
}
