import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'required_permissions';

/**
 * Declare which permission codes are required to access a route.
 * All listed codes must be present in the user's resolved permission set.
 *
 * @example
 * @RequirePermissions('users:read', 'users:update')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
