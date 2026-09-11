import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { PermissionResolverService } from '../permission-resolver.service';
import { JwtPayload } from '../token.service';
import { RequestUser } from '../../../common/interfaces/request-user.interface';
import { UserStatus } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly permissionResolver: PermissionResolverService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('auth.jwtSecret') ?? 'CHANGE_ME',
    });
  }

  /**
   * Called after JWT signature is verified.
   * We re-resolve permissions from the database on every request so that
   * permission changes and revocations take effect immediately without
   * requiring the user to log out and back in.
   */
  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        status: true,
        branchId: true,
        departmentId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase().replace('_', ' ')}`);
    }

    // Always re-resolve permissions from DB — never trust JWT payload permissions
    const permissions = await this.permissionResolver.resolveForUser(user.id);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      branchId: user.branchId,
      departmentId: user.departmentId,
      permissions,
    };
  }
}
