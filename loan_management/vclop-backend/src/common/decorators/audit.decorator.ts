import { SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { AuditAction } from '@prisma/client';

export const AUDIT_META_KEY = 'audit_meta';

export interface AuditMeta {
  action: AuditAction;
  module: string;
  subModule?: string;
  entityType?: string;
  description?: string;
  captureBody?: boolean;
  captureResult?: boolean;
  getEntityId?: (request: Request) => string | undefined;
}

/**
 * Attach audit metadata to a route handler.
 * The AuditInterceptor will pick this up and emit an audit.log event.
 *
 * @example
 * @Audit({ action: AuditAction.UPDATE, module: 'users', entityType: 'User', getEntityId: (req) => req.params.id })
 */
export const Audit = (meta: AuditMeta) => SetMetadata(AUDIT_META_KEY, meta);
