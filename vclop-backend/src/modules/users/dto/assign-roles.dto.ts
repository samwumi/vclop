import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({ type: [String], description: 'Array of role UUIDs to assign' })
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds!: string[];

  @ApiPropertyOptional({ description: 'Optional expiry date for the role assignments' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class RevokeRolesDto {
  @ApiProperty({ type: [String], description: 'Array of role UUIDs to revoke' })
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds!: string[];
}
