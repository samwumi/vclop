import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenType } from '@prisma/client';
import { generateSecureToken, sha256 } from '../../common/utils/hash.util';
import { TokenExpiredException, TokenInvalidException } from '../../common/exceptions/app.exceptions';
import * as dayjs from 'dayjs';

export interface JwtPayload {
  sub: string;       // user id
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  branchId: string | null;
  departmentId: string | null;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // Access + Refresh Token Pair
  // ────────────────────────────────────────────────────────────────────────────

  async issueTokenPair(
    payload: JwtPayload,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const expiresIn = this.getAccessTokenTtlSeconds();

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('auth.jwtSecret'),
      expiresIn: this.config.get<string>('auth.jwtExpiresIn'),
    });

    const rawRefreshToken = generateSecureToken(48);
    const hashedToken = sha256(rawRefreshToken);
    const expiresAt = dayjs()
      .add(this.config.get<number>('auth.refreshExpiresInMs') ?? 2592000000, 'ms')
      .toDate();

    await this.prisma.token.create({
      data: {
        userId: payload.sub,
        type: TokenType.REFRESH,
        token: rawRefreshToken,
        hashedToken,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken, expiresIn };
  }

  async rotateRefreshToken(
    rawToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ userId: string; tokenPair: TokenPair }> {
    const hashed = sha256(rawToken);

    const stored = await this.prisma.token.findFirst({
      where: { hashedToken: hashed, type: TokenType.REFRESH },
      include: { user: true },
    });

    if (!stored) throw new TokenInvalidException();
    if (stored.revokedAt) throw new TokenInvalidException('Refresh token has been revoked');
    if (stored.expiresAt < new Date()) throw new TokenExpiredException('Refresh token has expired');

    // Revoke the old token (rotation)
    await this.prisma.token.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return { userId: stored.userId, tokenPair: { accessToken: '', refreshToken: '', expiresIn: 0 } };
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const hashed = sha256(rawToken);
    await this.prisma.token.updateMany({
      where: { hashedToken: hashed, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.token.updateMany({
      where: { userId, type: TokenType.REFRESH, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Password Reset Token
  // ────────────────────────────────────────────────────────────────────────────

  async issuePasswordResetToken(userId: string): Promise<string> {
    // Invalidate any existing reset tokens for this user
    await this.prisma.token.updateMany({
      where: { userId, type: TokenType.PASSWORD_RESET, usedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    const raw = generateSecureToken(32);
    const hashed = sha256(raw);
    const expiresMinutes = this.config.get<number>('auth.passwordResetExpiresIn') ?? 60;

    await this.prisma.token.create({
      data: {
        userId,
        type: TokenType.PASSWORD_RESET,
        token: raw,
        hashedToken: hashed,
        expiresAt: dayjs().add(expiresMinutes, 'minute').toDate(),
      },
    });

    return raw;
  }

  async consumePasswordResetToken(rawToken: string): Promise<string> {
    const hashed = sha256(rawToken);

    const stored = await this.prisma.token.findFirst({
      where: { hashedToken: hashed, type: TokenType.PASSWORD_RESET },
    });

    if (!stored) throw new TokenInvalidException('Invalid or expired reset token');
    if (stored.usedAt) throw new TokenInvalidException('Reset token has already been used');
    if (stored.revokedAt) throw new TokenInvalidException('Reset token has been revoked');
    if (stored.expiresAt < new Date()) throw new TokenExpiredException('Reset token has expired');

    await this.prisma.token.update({
      where: { id: stored.id },
      data: { usedAt: new Date() },
    });

    return stored.userId;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Email Verification Token
  // ────────────────────────────────────────────────────────────────────────────

  async issueEmailVerificationToken(userId: string): Promise<string> {
    const raw = generateSecureToken(32);
    const hashed = sha256(raw);
    const hours = this.config.get<number>('auth.emailVerificationExpiresIn') ?? 24;

    await this.prisma.token.create({
      data: {
        userId,
        type: TokenType.EMAIL_VERIFICATION,
        token: raw,
        hashedToken: hashed,
        expiresAt: dayjs().add(hours, 'hour').toDate(),
      },
    });

    return raw;
  }

  async consumeEmailVerificationToken(rawToken: string): Promise<string> {
    const hashed = sha256(rawToken);

    const stored = await this.prisma.token.findFirst({
      where: { hashedToken: hashed, type: TokenType.EMAIL_VERIFICATION },
    });

    if (!stored) throw new TokenInvalidException();
    if (stored.usedAt) throw new TokenInvalidException('Verification token already used');
    if (stored.expiresAt < new Date()) throw new TokenExpiredException('Verification token expired');

    await this.prisma.token.update({
      where: { id: stored.id },
      data: { usedAt: new Date() },
    });

    return stored.userId;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────────────

  verifyAccessToken(token: string): JwtPayload {
    try {
      return this.jwt.verify<JwtPayload>(token, {
        secret: this.config.get<string>('auth.jwtSecret'),
      });
    } catch {
      throw new TokenInvalidException('Access token is invalid or expired');
    }
  }

  private getAccessTokenTtlSeconds(): number {
    const raw = this.config.get<string>('auth.jwtExpiresIn') ?? '15m';
    const match = raw.match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * (multipliers[unit] ?? 60);
  }
}
