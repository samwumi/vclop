import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class SyncPermissionsDto {
  @ApiProperty({
    type: [String],
    description: 'Complete list of permission UUIDs. Replaces existing set entirely.',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds!: string[];
}
