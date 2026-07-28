import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AssignPermissionDto {
  @ApiProperty({ description: 'Permission UUID' })
  @IsUUID()
  permissionId!: string;

  @ApiProperty({ description: 'true = grant, false = explicitly deny (override)' })
  @IsBoolean()
  granted!: boolean;

  @ApiPropertyOptional({ description: 'Reason for grant or deny' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ description: 'Optional expiry for this override' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class BulkAssignPermissionsDto {
  @ApiProperty({ type: [AssignPermissionDto] })
  @IsArray()
  permissions!: AssignPermissionDto[];
}

export class RevokePermissionsDto {
  @ApiProperty({ type: [String], description: 'Permission UUIDs to remove' })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds!: string[];
}
