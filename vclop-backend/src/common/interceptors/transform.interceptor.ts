import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { Prisma } from '@prisma/client';
import { ApiResponse, PaginatedResult } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const statusCode = context.switchToHttp().getResponse<{ statusCode: number }>().statusCode;

    return next.handle().pipe(
      map((data) => {
        // If data is already a paginated result, lift meta to top level
        if (this.isPaginatedResult(data)) {
          const { data: items, meta } = data as PaginatedResult<T>;
          return {
            success: true,
            statusCode,
            message: 'OK',
            data: this.deepConvertDecimals(items) as unknown as T,
            meta,
            timestamp: new Date().toISOString(),
            requestId: request.headers['x-request-id'] as string | undefined,
          };
        }

        // If data has explicit message/data shape (set by controller)
        if (this.isApiShape(data)) {
          return {
            success: true,
            statusCode,
            message: (data as { message: string }).message ?? 'OK',
            data: this.deepConvertDecimals((data as { data: T }).data ?? null) as T,
            timestamp: new Date().toISOString(),
            requestId: request.headers['x-request-id'] as string | undefined,
          };
        }

        return {
          success: true,
          statusCode,
          message: 'OK',
          data: this.deepConvertDecimals(data ?? null) as T,
          timestamp: new Date().toISOString(),
          requestId: request.headers['x-request-id'] as string | undefined,
        };
      }),
    );
  }

  /**
   * Prisma's Decimal fields (every money/rate column in this app — loan
   * amounts, interest rates, installment balances, fees) serialize as
   * STRINGS via JSON.stringify (decimal.js's toJSON returns toString()),
   * not numbers — regardless of what the generated Prisma types or any
   * frontend TS interface claims. This walks every response body once,
   * converting Decimal instances to plain numbers, so `number` actually
   * means number by the time it reaches the client. Precision loss beyond
   * JS's float precision is not a concern here given the @db.Decimal(14,2)
   * scale used throughout — well within safe float range for these amounts.
   */
  private deepConvertDecimals(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (value instanceof Prisma.Decimal) return value.toNumber();
    if (value instanceof Date) return value;
    if (Array.isArray(value)) return value.map((item) => this.deepConvertDecimals(item));
    if (typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        result[key] = this.deepConvertDecimals(val);
      }
      return result;
    }
    return value;
  }

  private isPaginatedResult(data: unknown): boolean {
    return (
      typeof data === 'object' &&
      data !== null &&
      'data' in data &&
      'meta' in data &&
      typeof (data as Record<string, unknown>).meta === 'object'
    );
  }

  private isApiShape(data: unknown): boolean {
    return (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      'data' in data &&
      !('meta' in data)
    );
  }
}