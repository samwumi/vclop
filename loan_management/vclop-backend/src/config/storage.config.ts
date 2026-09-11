import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  driver: process.env.STORAGE_DRIVER ?? 'local', // 'local' | 's3'
  local: {
    uploadDir: process.env.UPLOAD_DIR ?? './uploads',
    publicUrl: process.env.STORAGE_PUBLIC_URL ?? 'http://localhost:3000/uploads',
  },
  s3: {
    bucket: process.env.S3_BUCKET ?? '',
    region: process.env.S3_REGION ?? 'ap-southeast-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    endpoint: process.env.S3_ENDPOINT ?? undefined,
    publicUrl: process.env.S3_PUBLIC_URL ?? '',
  },
}));
