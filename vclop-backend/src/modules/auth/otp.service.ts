import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpCodeType } from '@prisma/client';
import { BusinessException } from '../../common/exceptions/app.exceptions';
import dayjs from 'dayjs';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 10;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a 6-digit OTP code and store in database
   */
  async generateOtp(
    userId: string,
    email: string,
    type: OtpCodeType,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Calculate expiry time (10 minutes from now)
    const expiresAt = dayjs().add(this.OTP_EXPIRY_MINUTES, 'minute').toDate();

    // Clean up any expired OTPs for this user and type before creating new one
    await this.prisma.otpCode.deleteMany({
      where: {
        userId,
        type,
        OR: [
          { expiresAt: { lt: new Date() } },
          { usedAt: { not: null } },
        ],
      },
    });

    // Store OTP in database
    await this.prisma.otpCode.create({
      data: {
        userId,
        email,
        code,
        type,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    this.logger.log(`OTP generated for user ${userId} (type: ${type})`);

    return code;
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(
    userId: string,
    code: string,
    type: OtpCodeType,
  ): Promise<boolean> {
    // Find matching OTP
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        userId,
        code,
        type,
        usedAt: null, // Not already used
        expiresAt: { gte: new Date() }, // Not expired
      },
    });

    if (!otpRecord) {
      this.logger.warn(
        `Invalid or expired OTP attempt for user ${userId} (type: ${type})`,
      );
      return false;
    }

    // Mark as used
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    this.logger.log(`OTP verified successfully for user ${userId} (type: ${type})`);

    return true;
  }

  /**
   * Clean up expired OTPs (can be called by cron job)
   */
  async cleanExpiredOtps(): Promise<number> {
    const result = await this.prisma.otpCode.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { usedAt: { not: null } },
        ],
      },
    });

    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} expired/used OTP codes`);
    }

    return result.count;
  }

  /**
   * Get remaining time for OTP expiry in seconds
   */
  async getOtpExpirySeconds(
    userId: string,
    type: OtpCodeType,
  ): Promise<number | null> {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        userId,
        type,
        usedAt: null,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) return null;

    const now = dayjs();
    const expiry = dayjs(otpRecord.expiresAt);
    const remainingSeconds = expiry.diff(now, 'second');

    return remainingSeconds > 0 ? remainingSeconds : null;
  }

  /**
   * Check if user has a valid (non-expired, unused) OTP
   */
  async hasValidOtp(userId: string, type: OtpCodeType): Promise<boolean> {
    const count = await this.prisma.otpCode.count({
      where: {
        userId,
        type,
        usedAt: null,
        expiresAt: { gte: new Date() },
      },
    });

    return count > 0;
  }
}
