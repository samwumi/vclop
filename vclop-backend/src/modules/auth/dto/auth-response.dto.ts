import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() username!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty({ nullable: true }) avatarPath!: string | null;
  @ApiProperty({ nullable: true }) branchId!: string | null;
  @ApiProperty({ nullable: true }) branchName!: string | null;
  @ApiProperty({ nullable: true }) departmentId!: string | null;
  @ApiProperty({ nullable: true }) departmentName!: string | null;
  @ApiProperty({ nullable: true }) jobTitle!: string | null;
  @ApiProperty() mustChangePassword!: boolean;
  @ApiProperty() twoFactorEnabled!: boolean;
  @ApiProperty({ type: [String] }) permissions!: string[];
}

export class AuthResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty() refreshToken!: string;
  @ApiProperty() expiresIn!: number;
  @ApiProperty({ type: AuthUserDto }) user!: AuthUserDto;
}
