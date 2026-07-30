import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from './token.service';
import { PermissionResolverService } from './permission-resolver.service';
import { User, UserStatus } from '@prisma/client';
import {
  AccountLockedException,
  InvalidCredentialsException,
  BusinessException,
  ResourceNotFoundException,
} from '../../common/exceptions/app.exceptions';
import { comparePassword, hashPassword } from '../../common/utils/hash.util';
import {
  validatePassword,
  getDefaultPasswordPolicy,
} from '../../common/utils/password-validator.util';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuditAction } from '@prisma/client';
import  dayjs from 'dayjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly permissionResolver: PermissionResolverService,
    private readonly config: ConfigService,
    private readonly events: EventEmitter2,
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // CREDENTIAL VALIDATION  (used by LocalStrategy)
  // ────────────────────────────────────────────────────────────────────────────

  async validateCredentials(login: string, password: string): Promise<Partial<User>> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: login.toLowerCase() }, { username: login.toLowerCase() }],
        deletedAt: null,
      },
    });

    if (!user) {
      throw new InvalidCredentialsException();
    }

    // Check lockout before anything else
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AccountLockedException(user.lockedUntil);
    }

    // Status checks
    if (user.status === UserStatus.SUSPENDED) {
      throw new AccountLockedException();
    }

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new BusinessException('Account email not yet verified', 403);
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new BusinessException('Account is inactive. Contact an administrator.', 403);
    }

    const passwordValid = await comparePassword(password, user.passwordHash);

    if (!passwordValid) {
      await this.handleFailedLogin(user);
      throw new InvalidCredentialsException();
    }

    // Reset failure count on success
    if (user.failedLoginCount > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null },
      });
    }

    return user;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // LOGIN
  // ────────────────────────────────────────────────────────────────────────────

  async login(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        branch:     { select: { name: true } },
        department: { select: { name: true } },
      },
    });

    const permissions = await this.permissionResolver.resolveAsArray(userId);

    const tokenPair = await this.tokenService.issueTokenPair(
      {
        sub: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        branchId: user.branchId,
        departmentId: user.departmentId,
        permissions,
      },
      ipAddress,
      userAgent,
    );

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });

    this.events.emit('audit.log', {
      userId: user.id,
      userEmail: user.email,
      userFullName: `${user.firstName} ${user.lastName}`,
      action: AuditAction.LOGIN,
      module: 'auth',
      description: 'User logged in',
      ipAddress,
      userAgent,
      isSuccess: true,
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarPath: user.avatarPath,
        branchId: user.branchId,
        branchName: user.branch?.name ?? null,
        departmentId: user.departmentId,
        departmentName: user.department?.name ?? null,
        jobTitle: user.jobTitle,
        mustChangePassword: user.mustChangePassword,
        twoFactorEnabled: user.twoFactorEnabled,
        permissions,
      },
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // REFRESH TOKEN
  // ────────────────────────────────────────────────────────────────────────────

  async refreshTokens(
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const { userId } = await this.tokenService.rotateRefreshToken(
      rawRefreshToken,
      ipAddress,
      userAgent,
    );

    return this.login(userId, ipAddress, userAgent);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // LOGOUT
  // ────────────────────────────────────────────────────────────────────────────

  async logout(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true },
    });

    this.events.emit('audit.log', {
      userId,
      userEmail: user?.email,
      userFullName: user ? `${user.firstName} ${user.lastName}` : undefined,
      action: AuditAction.LOGOUT,
      module: 'auth',
      description: 'User logged out',
      ipAddress,
      userAgent,
      isSuccess: true,
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.tokenService.revokeAllUserRefreshTokens(userId);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // FORGOT / RESET PASSWORD
  // ────────────────────────────────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });

    // Always respond successfully — never reveal whether email exists
    if (!user) return;

    const token = await this.tokenService.issuePasswordResetToken(user.id);

    this.events.emit('notification.send', {
      recipientId: user.id,
      recipientEmail: user.email,
      event: 'auth.password_reset',
      variables: {
        firstName: user.firstName,
        resetLink: `${this.config.get<string>('app.frontendUrl')}/auth/reset-password?token=${token}`,
        expiresIn: `${this.config.get<number>('auth.passwordResetExpiresIn') ?? 60} minutes`,
      },
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const policy = getDefaultPasswordPolicy();
    const validation = validatePassword(newPassword, policy);
    if (!validation.valid) {
      throw new BusinessException(validation.errors.join('. '));
    }

    const userId = await this.tokenService.consumePasswordResetToken(token);

    const hashed = await hashPassword(
      newPassword,
      this.config.get<number>('auth.bcryptRounds') ?? 12,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashed,
        mustChangePassword: false,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    // Revoke all active sessions after password reset
    await this.tokenService.revokeAllUserRefreshTokens(userId);

    this.events.emit('audit.log', {
      userId,
      action: AuditAction.PASSWORD_RESET,
      module: 'auth',
      description: 'Password reset via token',
      isSuccess: true,
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CHANGE PASSWORD  (authenticated)
  // ────────────────────────────────────────────────────────────────────────────

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ResourceNotFoundException('User');

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) throw new InvalidCredentialsException('Current password is incorrect');

    const policy = getDefaultPasswordPolicy();
    const validation = validatePassword(newPassword, policy);
    if (!validation.valid) throw new BusinessException(validation.errors.join('. '));

    const hashed = await hashPassword(
      newPassword,
      this.config.get<number>('auth.bcryptRounds') ?? 12,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashed, mustChangePassword: false },
    });

    // Revoke all other sessions — force re-login on other devices
    await this.tokenService.revokeAllUserRefreshTokens(userId);

    this.events.emit('audit.log', {
      userId,
      action: AuditAction.PASSWORD_CHANGE,
      module: 'auth',
      description: 'Password changed',
      isSuccess: true,
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // EMAIL VERIFICATION
  // ────────────────────────────────────────────────────────────────────────────

  async verifyEmail(token: string): Promise<void> {
    const userId = await this.tokenService.consumeEmailVerificationToken(token);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ResourceNotFoundException('User');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        status: user.status === UserStatus.PENDING_VERIFICATION ? UserStatus.ACTIVE : user.status,
      },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 2FA — SETUP
  // ────────────────────────────────────────────────────────────────────────────

  async setup2fa(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const speakeasy = require('speakeasy') as typeof import('speakeasy');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const qrcode = require('qrcode') as typeof import('qrcode');

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const appName = this.config.get<string>('app.name') ?? 'VCLOP';

    const secret = speakeasy.generateSecret({
      name: `${appName} (${user.email})`,
      length: 32,
    });

    // Store temp secret (not yet confirmed)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url ?? '');

    return { secret: secret.base32, qrCodeUrl };
  }

  async confirm2fa(userId: string, code: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const speakeasy = require('speakeasy') as typeof import('speakeasy');

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorSecret) throw new BusinessException('2FA not set up');

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!valid) throw new BusinessException('Invalid 2FA code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
  }

  async disable2fa(userId: string, code: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const speakeasy = require('speakeasy') as typeof import('speakeasy');

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BusinessException('2FA is not enabled');
    }

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!valid) throw new BusinessException('Invalid 2FA code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ME  (current user profile)
  // ────────────────────────────────────────────────────────────────────────────

  async getMe(userId: string): Promise<AuthResponseDto['user']> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true, email: true, username: true, firstName: true, lastName: true,
        avatarPath: true, branchId: true, departmentId: true, jobTitle: true,
        mustChangePassword: true, twoFactorEnabled: true,
        branch: { select: { name: true } },
        department: { select: { name: true } },
      },
    });

    const permissions = await this.permissionResolver.resolveAsArray(userId);
    return {
      id: user.id, email: user.email, username: user.username,
      firstName: user.firstName, lastName: user.lastName,
      avatarPath: user.avatarPath, branchId: user.branchId,
      departmentId: user.departmentId, jobTitle: user.jobTitle,
      mustChangePassword: user.mustChangePassword, twoFactorEnabled: user.twoFactorEnabled,
      branchName: user.branch?.name ?? null,
      departmentName: user.department?.name ?? null,
      permissions,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ────────────────────────────────────────────────────────────────────────────

  private async handleFailedLogin(user: User): Promise<void> {
    const maxAttempts = parseInt(
      await this.getSettingValue('security.max_failed_logins', '5'),
      10,
    );
    const lockoutMinutes = parseInt(
      await this.getSettingValue('security.lockout_minutes', '30'),
      10,
    );

    const newCount = user.failedLoginCount + 1;
    const shouldLock = newCount >= maxAttempts;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: newCount,
        lockedUntil: shouldLock ? dayjs().add(lockoutMinutes, 'minute').toDate() : undefined,
        status: shouldLock ? UserStatus.LOCKED : undefined,
      },
    });

    this.events.emit('audit.log', {
      userId: user.id,
      userEmail: user.email,
      action: AuditAction.LOGIN_FAILED,
      module: 'auth',
      description: `Failed login attempt ${newCount}/${maxAttempts}`,
      isSuccess: false,
    });
  }

  private async getSettingValue(key: string, defaultValue: string): Promise<string> {
    const setting = await this.prisma.setting.findFirst({ where: { key } });
    return setting?.value ?? defaultValue;
  }
}
