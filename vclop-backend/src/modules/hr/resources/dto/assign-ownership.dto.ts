import { IsNotEmpty, IsString, IsDate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class AssignOwnershipDto {
  @ApiProperty({ enum: ResourceType, description: 'Resource type' })
  @IsNotEmpty()
  @IsEnum(ResourceType)
  resourceType!: ResourceType;

  @ApiProperty({ description: 'Resource ID (customer ID, loan ID, etc.)' })
  @IsNotEmpty()
  @IsString()
  resourceId!: string;

  @ApiProperty({ description: 'New owner user ID' })
  @IsNotEmpty()
  @IsString()
  ownerId!: string;

  @ApiProperty({ description: 'Effective from date', example: '2026-10-28' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  effectiveFrom!: Date;

  @ApiProperty({ description: 'Reason for assignment/reassignment' })
  @IsNotEmpty()
  @IsString()
  reason!: string;
}
