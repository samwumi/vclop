import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import * as mime from 'mime-types';
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
    } else {
      // Placeholder for S3 — swap driver without changing callers
      throw new Error(`Storage driver '${driverType}' not yet implemented`);
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
    return `${this.publicUrl}/${key}`;
  }
}
