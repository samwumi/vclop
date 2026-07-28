import {
  Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus,
  Patch, Req, Version,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IpAddress } from '../../common/decorators/ip-address.decorator';
import { UserAgent } from '../../common/decorators/user-agent.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ok } from '../../common/utils/response.util';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/v1/auth/login
  // ──────────────────────────────────────────────────────────────────────────

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email/username and password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(
    @Body() dto: LoginDto,
    @IpAddress() ip: string,
    @UserAgent() ua: string,
  ): Promise<{ message: string; data: AuthResponseDto }> {
    const user = await this.authService.validateCredentials(dto.login, dto.password);
    const result = await this.authService.login(user.id as string, ip, ua);
    return ok(result, 'Login successful');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/v1/auth/refresh
  // ──────────────────────────────────────────────────────────────────────────

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @IpAddress() ip: string,
    @UserAgent() ua: string,
  ): Promise<{ message: string; data: AuthResponseDto }> {
    const result = await this.authService.refreshTokens(dto.refreshToken, ip, ua);
    return ok(result, 'Token refreshed');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/v1/auth/logout
  // ──────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke current session refresh token' })
  async logout(
    @CurrentUser() user: RequestUser,
    @Body() dto: RefreshTokenDto,
    @IpAddress() ip: string,
    @UserAgent() ua: string,
  ): Promise<{ message: string; data: null }> {
    await this.authService.logout(user.id, dto.refreshToken, ip, ua);
    return ok(null, 'Logged out successfully');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/v1/auth/logout-all
  // ──────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all active sessions for current user' })
  async logoutAll(
    @CurrentUser() user: RequestUser,
  ): Promise<{ message: string; data: null }> {
    await this.authService.logoutAll(user.id);
    return ok(null, 'All sessions terminated');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/v1/auth/me
  // ──────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile and permissions' })
  async me(
    @CurrentUser() user: RequestUser,
  ): Promise<{ message: string; data: AuthResponseDto['user'] }> {
    const profile = await this.authService.getMe(user.id);
    return ok(profile, 'Profile loaded');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/v1/auth/forgot-password
  // ──────────────────────────────────────────────────────────────────────────

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string; data: null }> {
    await this.authService.forgotPassword(dto.email);
    return ok(null, 'If an account with that email exists, a reset link has been sent');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/v1/auth/reset-password
  // ──────────────────────────────────────────────────────────────────────────

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token from email' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string; data: null }> {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return ok(null, 'Password reset successfully. Please log in with your new password.');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PATCH /api/v1/auth/change-password
  // ──────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password (authenticated user)' })
  async changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string; data: null }> {
    await this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
    return ok(null, 'Password changed. Please log in again on all devices.');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/v1/auth/verify-email
  // ──────────────────────────────────────────────────────────────────────────

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address with token' })
  async verifyEmail(
    @Body('token') token: string,
  ): Promise<{ message: string; data: null }> {
    await this.authService.verifyEmail(token);
    return ok(null, 'Email verified successfully');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2FA  ─────────────────────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('2fa/setup')
  @ApiOperation({ summary: 'Generate 2FA secret and QR code' })
  async setup2fa(
    @CurrentUser() user: RequestUser,
  ): Promise<{ message: string; data: { secret: string; qrCodeUrl: string } }> {
    const result = await this.authService.setup2fa(user.id);
    return ok(result, '2FA setup initiated. Scan the QR code in your authenticator app.');
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('2fa/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm and enable 2FA with TOTP code' })
  async confirm2fa(
    @CurrentUser() user: RequestUser,
    @Body() dto: Verify2faDto,
  ): Promise<{ message: string; data: null }> {
    await this.authService.confirm2fa(user.id, dto.code);
    return ok(null, '2FA enabled successfully');
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable 2FA' })
  async disable2fa(
    @CurrentUser() user: RequestUser,
    @Body() dto: Verify2faDto,
  ): Promise<{ message: string; data: null }> {
    await this.authService.disable2fa(user.id, dto.code);
    return ok(null, '2FA disabled');
  }
}
