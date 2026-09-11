import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import * as mime from 'mime-types';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { StorageException } from '../../common/exceptions/app.exceptions';

export interface StoredFile {
  key: string;         // relative storage key / path
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface StorageDriver {
  store(buffer: Buffer, key: string, mimeType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly driver: StorageDriver;

  constructor(private readonly configService: ConfigService) {
    const driverType = configService.get<string>('storage.driver') ?? 'local';

    if (driverType === 'local') {
      const uploadDir = configService.get<string>('storage.local.uploadDir') ?? './uploads';
      const publicUrl = configService.get<string>('storage.local.publicUrl') ?? '';
      this.driver = new LocalStorageDriver(uploadDir, publicUrl);
      this.logger.log('Storage driver initialized: LOCAL');
    } else if (driverType === 's3') {
      const s3Config = {
        bucket: configService.get<string>('storage.s3.bucket') ?? '',
        region: configService.get<string>('storage.s3.region') ?? 'us-east-1',
        accessKeyId: configService.get<string>('storage.s3.accessKeyId') ?? '',
        secretAccessKey: configService.get<string>('storage.s3.secretAccessKey') ?? '',
        endpoint: configService.get<string>('storage.s3.endpoint'), // optional for custom S3-compatible storage
      };

      if (!s3Config.bucket || !s3Config.accessKeyId || !s3Config.secretAccessKey) {
        throw new Error(
          'S3 storage driver requires S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY environment variables',
        );
      }

      this.driver = new S3StorageDriver(s3Config);
      this.logger.log(`Storage driver initialized: S3 (bucket: ${s3Config.bucket}, region: ${s3Config.region})`);
    } else {
      throw new Error(`Storage driver '${driverType}' not supported`);
    }
  }

  async storeFile(
    file: Express.Multer.File,
    folder = 'general',
  ): Promise<StoredFile> {
    try {
      const ext = mime.extension(file.mimetype) || 'bin';
      const key = `${folder}/${uuidv4()}.${ext}`;
      const url = await this.driver.store(file.buffer, key, file.mimetype);

      return {
        key,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
      };
    } catch (err) {
      this.logger.error(`Failed to store file: ${(err as Error).message}`);
      throw new StorageException('Failed to store file');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.driver.delete(key);
    } catch (err) {
      this.logger.warn(`Failed to delete file '${key}': ${(err as Error).message}`);
    }
  }

  getFileUrl(key: string): string {
    return this.driver.getUrl(key);
  }
}

// =============================================================================
// LOCAL DRIVER
// =============================================================================

class LocalStorageDriver implements StorageDriver {
  constructor(
    private readonly uploadDir: string,
    private readonly publicUrl: string,
  ) {}

  async store(buffer: Buffer, key: string, _mimeType: string): Promise<string> {
    const fullPath = path.join(this.uploadDir, key);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, buffer);
    return this.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, key);
    await fs.rm(fullPath, { force: true });
  }

  getUrl(key: string): string {
    // Always return a root-relative path so it resolves correctly on any domain.
    // The backend serves /uploads/* as static assets — no absolute URL needed.
    // This prevents old localhost URLs leaking into DB records on production.
    return `/uploads/${key}`;
  }
}

// =============================================================================
// S3 DRIVER
// =============================================================================

interface S3Config {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
}

class S3StorageDriver implements StorageDriver {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: S3Config) {
    this.bucket = config.bucket;
    
    const clientConfig: any = {
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    };

    // Support custom endpoints for S3-compatible services (e.g., DigitalOcean Spaces, MinIO)
    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint;
      clientConfig.forcePathStyle = true; // Required for some S3-compatible services
    }

    this.s3Client = new S3Client(clientConfig);
  }

  async store(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // Make files publicly readable (adjust based on your security requirements)
      ACL: 'public-read',
    });

    await this.s3Client.send(command);
    return this.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  getUrl(key: string): string {
    // If using custom endpoint, construct URL from endpoint
    if (this.config.endpoint) {
      const endpoint = this.config.endpoint.replace(/\/$/, ''); // Remove trailing slash
      return `${endpoint}/${this.bucket}/${key}`;
    }
    
    // Standard AWS S3 URL format
    return `https://${this.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }
}
