import * as Joi from 'joi';

/**
 * Joi validation schema for all environment variables.
 * The app will throw at startup if any required variable is missing
 * or has an invalid value — preventing silent misconfiguration in production.
 */
export const envValidationSchema = Joi.object({
  // ── Application ──────────────────────────────────────────────────────────
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  APP_NAME: Joi.string().default('VCLOP'),
  DEBUG: Joi.boolean().default(false),

  // ── URLs ─────────────────────────────────────────────────────────────────
  FRONTEND_URL: Joi.string().uri().default('http://localhost:5173'),
  API_URL: Joi.string().uri().default('http://localhost:3000'),

  // ── Database ─────────────────────────────────────────────────────────────
  DATABASE_URL: Joi.string().required(),

  // ── Auth / JWT ───────────────────────────────────────────────────────────
  JWT_SECRET: Joi.string()
    .min(32)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().min(32).required(),
      otherwise: Joi.string().min(32).default('dev-jwt-secret-change-me-in-production!!'),
    }),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  REFRESH_TOKEN_SECRET: Joi.string()
    .min(32)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().min(32).required(),
      otherwise: Joi.string().min(32).default('dev-refresh-secret-change-me-in-production!!'),
    }),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('30d'),
  REFRESH_TOKEN_EXPIRES_DAYS: Joi.number().integer().min(1).default(30),
  BCRYPT_ROUNDS: Joi.number().integer().min(10).max(14).default(12),
  PASSWORD_RESET_EXPIRES_MINUTES: Joi.number().integer().min(5).default(60),
  EMAIL_VERIFICATION_EXPIRES_HOURS: Joi.number().integer().min(1).default(24),

  // ── Seed ─────────────────────────────────────────────────────────────────
  SEED_ADMIN_PASSWORD: Joi.string().min(8).default('Admin@12345!'),

  // ── File Storage ─────────────────────────────────────────────────────────
  UPLOAD_DIR: Joi.string().default('./uploads'),
  MAX_FILE_SIZE_MB: Joi.number().integer().min(1).max(100).default(10),
  ALLOWED_MIME_TYPES: Joi.string().default(
    'image/jpeg,image/png,image/webp,application/pdf',
  ),
  STORAGE_DRIVER: Joi.string().valid('local', 's3').default('local'),
  STORAGE_PUBLIC_URL: Joi.string().uri().optional(),

  // ── S3 (required only when STORAGE_DRIVER=s3) ────────────────────────────
  S3_BUCKET: Joi.when('STORAGE_DRIVER', {
    is: 's3',
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow(''),
  }),
  S3_REGION: Joi.string().default('ap-southeast-1'),
  S3_ACCESS_KEY_ID: Joi.when('STORAGE_DRIVER', {
    is: 's3',
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow(''),
  }),
  S3_SECRET_ACCESS_KEY: Joi.when('STORAGE_DRIVER', {
    is: 's3',
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow(''),
  }),
  S3_ENDPOINT: Joi.string().uri().optional(),
  S3_PUBLIC_URL: Joi.string().uri().optional(),

  // ── Mail ─────────────────────────────────────────────────────────────────
  MAIL_HOST: Joi.string().hostname().default('sandbox.smtp.mailtrap.io'),
  MAIL_PORT: Joi.number().port().default(2525),
  MAIL_SECURE: Joi.boolean().default(false),
  MAIL_USER: Joi.string().allow('').default(''),
  MAIL_PASSWORD: Joi.string().allow('').default(''),
  MAIL_FROM_NAME: Joi.string().default('VCLOP'),
  MAIL_FROM_EMAIL: Joi.string().email({ tlds: { allow: false } }).default('noreply@vclop.local'),
});
