import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsArray, ArrayMinSize } from 'class-validator';

export class GrantLocationPermissionDto {
  @ApiProperty({ description: 'Array of branch IDs to grant location-based viewing permission', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  branchIds!: string[];
}

export class LocationPermissionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  branchId!: string;

  @ApiProperty()
  branchName!: string;

  @ApiProperty()
  branchCode!: string;

  @ApiProperty()
  canViewLoans!: boolean;

  @ApiProperty()
  grantedById?: string;

  @ApiProperty()
  grantedByName?: string;

  @ApiProperty()
  grantedAt!: Date;

  @ApiProperty()
  revokedAt?: Date;
}
