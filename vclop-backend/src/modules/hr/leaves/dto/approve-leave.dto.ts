import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApprovalDecision } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveLeaveDto {
  @ApiProperty({ enum: ApprovalDecision, description: 'Approval decision' })
  @IsNotEmpty()
  @IsEnum(ApprovalDecision)
  decision!: ApprovalDecision;

  @ApiPropertyOptional({ description: 'Comments or reasons' })
  @IsOptional()
  @IsString()
  comments?: string;
}
