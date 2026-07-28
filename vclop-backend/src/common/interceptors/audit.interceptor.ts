import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request } from 'express';
import { AUDIT_META_KEY, AuditMeta } from '../decorators/audit.decorator';
import { RequestUser } from '../interfaces/request-user.interface';
import { parseUserAgent } from '../utils/user-agent.util';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditMeta = this.reflector.getAllAndOverride<AuditMeta>(AUDIT_META_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!auditMeta) return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as RequestUser | undefined;
    const ua = parseUserAgent(request.headers['user-agent'] ?? '');

    const startValues = auditMeta.captureBody ? structuredClone(request.body) : undefined;

    return next.handle().pipe(
      tap({
        next: (result: unknown) => {
          this.eventEmitter.emit('audit.log', {
            userId: user?.id,
            userEmail: user?.email,
            userFullName: user ? `${user.firstName} ${user.lastName}` : undefined,
            action: auditMeta.action,
            module: auditMeta.module,
            subModule: auditMeta.subModule,
            entityId: auditMeta.getEntityId ? auditMeta.getEntityId(request) : undefined,
            entityType: auditMeta.entityType,
            description: auditMeta.description,
            oldValues: startValues,
            newValues: auditMeta.captureResult ? result : undefined,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            browser: ua.browser,
            os: ua.os,
            device: ua.device,
            requestId: request.headers['x-request-id'] as string,
            isSuccess: true,
          });
        },
        error: (err: Error) => {
          this.eventEmitter.emit('audit.log', {
            userId: user?.id,
            userEmail: user?.email,
            action: auditMeta.action,
            module: auditMeta.module,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            requestId: request.headers['x-request-id'] as string,
            isSuccess: false,
            errorMessage: err.message,
          });
        },
      }),
    );
  }
}
