import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET ?? 'CHANGE_ME_IN_PRODUCTION',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  refreshSecret: process.env.REFRESH_TOKEN_SECRET ?? 'CHANGE_ME_REFRESH_IN_PRODUCTION',
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '30d',
  refreshExpiresInMs: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? '30', 10) * 24 * 60 * 60 * 1000,
  passwordResetExpiresIn: parseInt(process.env.PASSWORD_RESET_EXPIRES_MINUTES ?? '60', 10),
  emailVerificationExpiresIn: parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_HOURS ?? '24', 10),
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
}));
