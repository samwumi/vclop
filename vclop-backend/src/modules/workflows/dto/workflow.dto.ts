import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { WorkflowAction } from '@prisma/client';

export class WorkflowStageInputDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100) code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(150) name!: string;
  @ApiProperty() @IsInt() @Min(0) sortOrder!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() requiredPermission?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) slaHours?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isInitial?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isTerminal?: boolean;
  @ApiPropertyOptional({ enum: WorkflowAction, isArray: true }) @IsOptional() @IsArray() @IsEnum(WorkflowAction, { each: true }) allowedActions?: WorkflowAction[];
}

export class WorkflowTransitionInputDto {
  @ApiProperty() @IsString() fromStageCode!: string;
  @ApiProperty() @IsString() toStageCode!: string;
  @ApiProperty({ enum: WorkflowAction }) @IsEnum(WorkflowAction) action!: WorkflowAction;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requiresReason?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsObject() conditions?: Record<string, unknown>;
}

export class CreateWorkflowDefinitionDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100) code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(150) name!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100) entityType!: string;
  @ApiProperty({ type: [WorkflowStageInputDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => WorkflowStageInputDto) stages!: WorkflowStageInputDto[];
  @ApiProperty({ type: [WorkflowTransitionInputDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => WorkflowTransitionInputDto) transitions!: WorkflowTransitionInputDto[];
}

export class TransitionWorkflowDto {
  @ApiProperty({ enum: WorkflowAction }) @IsEnum(WorkflowAction) action!: WorkflowAction;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assignToId?: string;
}
