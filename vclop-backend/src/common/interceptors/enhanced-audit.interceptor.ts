import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ENHANCED_AUDIT_KEY,
  EnhancedAuditOptions,
} from '../decorators/enhanced-audit.decorator';
import { AuditAction } from '@prisma/client';

@Injectable()
export class EnhancedAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EnhancedAuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly events: EventEmitter2,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditOptions = this.reflector.get<EnhancedAuditOptions>(
      ENHANCED_AUDIT_KEY,
      context.getHandler(),
    );

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    // Extract user and request info
    const user = request.user;
    const userId = user?.id;
    const userEmail = user?.email;
    const userFullName = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : undefined;

    const ipAddress = request.ip || request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'];
    const method = request.method;
    const url = request.url;
    const requestId = request.id || request.headers['x-request-id'];

    // Capture request body (with sensitive field redaction)
    let requestBody: unknown = undefined;
    if (auditOptions.captureRequest && request.body) {
      requestBody = this.redactSensitiveFields(
        request.body,
        auditOptions.sensitiveFields || [],
      );
    }

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime;

        // Capture response (with sensitive field redaction)
        let responseData: unknown = undefined;
        if (auditOptions.captureResponse) {
          responseData = this.redactSensitiveFields(
            response,
            auditOptions.sensitiveFields || [],
          );
        }

        // Emit enhanced audit log
        this.events.emit('audit.log', {
          userId,
          userEmail,
          userFullName,
          action: this.mapToAuditAction(method),
          module: auditOptions.category,
          subModule: url,
          description: auditOptions.description,
          ipAddress,
          userAgent,
          requestId,
          duration,
          statusCode: 200,
          isSuccess: true,
          metadata: {
            level: auditOptions.level,
            category: auditOptions.category,
            method,
            url,
            requestBody,
            responseData,
          },
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        // Log failed operation
        this.events.emit('audit.log', {
          userId,
          userEmail,
          userFullName,
          action: AuditAction.SYSTEM, // Use SYSTEM for errors
          module: auditOptions.category,
          subModule: url,
          description: `${auditOptions.description} FAILED`,
          ipAddress,
          userAgent,
          requestId,
          duration,
          statusCode: error.status || 500,
          isSuccess: false,
          errorMessage: error.message,
          metadata: {
            level: 'CRITICAL',
            category: auditOptions.category,
            method,
            url,
            requestBody,
            errorStack: error.stack,
          },
        });

        return throwError(() => error);
      }),
    );
  }

  private redactSensitiveFields(obj: unknown, sensitiveFields: string[]): unknown {
    if (!obj || typeof obj !== 'object') return obj;

    const redacted = { ...obj as Record<string, unknown> };

    sensitiveFields.forEach((field) => {
      if (field in redacted) {
        redacted[field] = '[REDACTED]';
      }
    });

    return redacted;
  }

  private mapToAuditAction(method: string): AuditAction {
    switch (method.toUpperCase()) {
      case 'POST':
        return AuditAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      case 'GET':
        return AuditAction.READ;
      default:
        return AuditAction.SYSTEM; // Use SYSTEM for unknown methods
    }
  }
}
