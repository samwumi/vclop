import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'VCLOP',
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  apiUrl: process.env.API_URL ?? 'http://localhost:3000',
  debug: process.env.DEBUG === 'true',
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE_MB ?? '10', 10) * 1024 * 1024,
  allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES ?? 'image/jpeg,image/png,image/webp,application/pdf').split(','),
}));
