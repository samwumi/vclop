import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super({ message, statusCode }, statusCode);
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super({ message, statusCode: HttpStatus.NOT_FOUND }, HttpStatus.NOT_FOUND);
  }
}

export class ResourceAlreadyExistsException extends HttpException {
  constructor(resource: string, field: string, value: string) {
    super(
      { message: `${resource} with ${field} '${value}' already exists`, statusCode: HttpStatus.CONFLICT },
      HttpStatus.CONFLICT,
    );
  }
}

export class ForbiddenActionException extends HttpException {
  constructor(message = 'You do not have permission to perform this action') {
    super({ message, statusCode: HttpStatus.FORBIDDEN }, HttpStatus.FORBIDDEN);
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor(message = 'Invalid credentials') {
    super({ message, statusCode: HttpStatus.UNAUTHORIZED }, HttpStatus.UNAUTHORIZED);
  }
}

export class AccountLockedException extends HttpException {
  constructor(lockedUntil?: Date) {
    const msg = lockedUntil
      ? `Account is locked until ${lockedUntil.toISOString()}`
      : 'Account is locked. Contact an administrator.';
    super({ message: msg, statusCode: HttpStatus.FORBIDDEN }, HttpStatus.FORBIDDEN);
  }
}

export class TokenExpiredException extends HttpException {
  constructor(message = 'Token has expired') {
    super({ message, statusCode: HttpStatus.UNAUTHORIZED }, HttpStatus.UNAUTHORIZED);
  }
}

export class TokenInvalidException extends HttpException {
  constructor(message = 'Invalid token') {
    super({ message, statusCode: HttpStatus.UNAUTHORIZED }, HttpStatus.UNAUTHORIZED);
  }
}

export class OptimisticLockException extends HttpException {
  constructor(resource: string) {
    super(
      { message: `${resource} was modified by another user. Please refresh and try again.`, statusCode: HttpStatus.CONFLICT },
      HttpStatus.CONFLICT,
    );
  }
}

export class StorageException extends HttpException {
  constructor(message: string) {
    super({ message, statusCode: HttpStatus.INTERNAL_SERVER_ERROR }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class ValidationFailedException extends HttpException {
  constructor(errors: Array<{ field: string; message: string }>) {
    super(
      { message: 'Validation failed', errors, statusCode: HttpStatus.UNPROCESSABLE_ENTITY },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
