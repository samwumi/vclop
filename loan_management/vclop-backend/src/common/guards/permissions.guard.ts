import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestUser } from '../interfaces/request-user.interface';
import { Request } from 'express';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @RequirePermissions decorator — route is accessible to any authenticated user
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as RequestUser | undefined;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // System admin shortcut — 'system:admin' grants everything
    if (user.permissions.has('system:admin')) return true;

    const hasAll = requiredPermissions.every((p) => user.permissions.has(p));

    if (!hasAll) {
      const missing = requiredPermissions.filter((p) => !user.permissions.has(p));
      throw new ForbiddenException(
        `Missing permission${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
      );
    }

    return true;
  }
}
