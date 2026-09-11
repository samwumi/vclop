import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    storageService: any,
    protected readonly reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected throwThrottlingException(): Promise<void> {
    throw new ThrottlerException('Too many requests. Please slow down.');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip throttling for public endpoints in dev
    if (process.env.NODE_ENV === 'development') {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (isPublic) return true;
    }
    return super.canActivate(context);
  }
}
