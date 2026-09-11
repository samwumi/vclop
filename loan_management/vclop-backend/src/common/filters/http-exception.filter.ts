import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  LoggerService,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse, ValidationError } from '../interfaces/api-response.interface';

interface HttpExceptionBody {
  message?: string | string[];
  error?: string;
  errors?: ValidationError[];
  statusCode?: number;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred';
    let errors: ValidationError[] | null = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse() as HttpExceptionBody;

      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object') {
        // NestJS ValidationPipe sends message as array
        if (Array.isArray(body.message)) {
          message = 'Validation failed';
          errors = body.message.map((msg) => ({
            field: this.extractField(msg),
            message: msg,
          }));
        } else {
          message = body.message ?? message;
          errors = body.errors ?? null;
        }
      }
    } else if (exception instanceof Error) {
      message = process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : exception.message;
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
        'HttpExceptionFilter',
      );
    }

    const body: ApiResponse<null> = {
      success: false,
      statusCode,
      message,
      data: null,
      errors,
      timestamp: new Date().toISOString(),
      requestId: request.headers['x-request-id'] as string | undefined,
    };

    response.status(statusCode).json(body);
  }

  private extractField(message: string): string {
    // "firstName must be a string" → "firstName"
    const match = message.match(/^(\w+)\s/);
    return match?.[1] ?? 'unknown';
  }
}
