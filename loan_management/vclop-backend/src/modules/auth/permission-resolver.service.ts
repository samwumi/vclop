import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * PermissionResolverService
 * ─────────────────────────
 * The single source of truth for "what can this user do?"
 *
 * Resolution order (last write wins):
 *   1. Collect all permissions from every Role assigned to the user.
 *   2. Apply UserPermission overrides:
 *      - granted = true  → add the permission
 *      - granted = false → REMOVE the permission (explicit deny)
 *
 * The resolved Set<string> of permission codes is attached to the JWT
 * payload and re-validated on every request via the JwtStrategy.
 *
 * We never check role codes anywhere. Everything checks permission codes.
 */
@Injectable()
export class PermissionResolverService {
  private readonly logger = new Logger(PermissionResolverService.name);

  constructor(private readonly prisma: PrismaService) {}

  async resolveForUser(userId: string): Promise<Set<string>> {
    // Load role-based permissions (through UserRole → RolePermission → Permission)
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        // Skip expired role assignments
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const resolved = new Set<string>();

    for (const userRole of userRoles) {
      if (!userRole.role.isActive) continue;
      for (const rp of userRole.role.rolePermissions) {
        if (rp.permission.isActive) {
          resolved.add(rp.permission.code);
        }
      }
    }

    // Apply direct user-level overrides
    const userPerms = await this.prisma.userPermission.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: { permission: true },
    });

    for (const up of userPerms) {
      if (!up.permission.isActive) continue;
      if (up.granted) {
        resolved.add(up.permission.code);
      } else {
        // Explicit deny — override even if role granted it
        resolved.delete(up.permission.code);
      }
    }

    this.logger.debug(`Resolved ${resolved.size} permissions for user ${userId}`);
    return resolved;
  }

  /**
   * Returns the permission codes as a sorted array (for JWT storage).
   */
  async resolveAsArray(userId: string): Promise<string[]> {
    const perms = await this.resolveForUser(userId);
    return [...perms].sort();
  }

  /**
   * Quick check — does a user have a specific permission right now?
   * Used for server-side conditional logic, not HTTP guards.
   */
  async userHasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const perms = await this.resolveForUser(userId);
    return perms.has('system:admin') || perms.has(permissionCode);
  }
}
