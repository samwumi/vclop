import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

/**
 * Encryption Service for sensitive data (BVN, NIN, etc.)
 * Uses AES-256-GCM for authenticated encryption
 */
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    // Get encryption key from environment, or generate one (for dev only)
    const keyString = this.config.get<string>('ENCRYPTION_KEY');
    
    if (!keyString) {
      console.warn('[EncryptionService] WARNING: ENCRYPTION_KEY not set. Using derived key (NOT SECURE FOR PRODUCTION)');
      // Derive a key from app secret (dev fallback only)
      const appSecret = this.config.get<string>('app.secret') || 'default-dev-secret';
      this.key = createHash('sha256').update(appSecret).digest();
    } else {
      this.key = Buffer.from(keyString, 'hex');
      
      if (this.key.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters). Generate with: openssl rand -hex 32');
      }
    }
  }

  /**
   * Encrypt sensitive data
   * @param plaintext - Data to encrypt
   * @returns Object with encrypted data, IV, and auth tag (store all three)
   */
  encrypt(plaintext: string): { encrypted: string; iv: string; authTag: string } {
    if (!plaintext) {
      throw new Error('Cannot encrypt empty value');
    }

    const iv = randomBytes(16); // Initialization vector
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag(); // For authenticated encryption

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypt sensitive data
   * @param encrypted - Encrypted data (hex string)
   * @param iv - Initialization vector (hex string)
   * @param authTag - Authentication tag (hex string)
   * @returns Decrypted plaintext
   */
  decrypt(encrypted: string, iv: string, authTag: string): string {
    if (!encrypted || !iv || !authTag) {
      throw new Error('Missing required decryption parameters');
    }

    try {
      const decipher = createDecipheriv(
        this.algorithm,
        this.key,
        Buffer.from(iv, 'hex')
      );
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed - data may be corrupted or key mismatch');
    }
  }

  /**
   * Hash sensitive data for comparison (one-way, cannot be decrypted)
   * Use for data you need to search/compare but don't need to display
   * @param data - Data to hash
   * @returns SHA-256 hash (hex string)
   */
  hash(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Combine encrypted data into a single string for storage
   * Format: encrypted$iv$authTag
   */
  packEncrypted(data: { encrypted: string; iv: string; authTag: string }): string {
    return `${data.encrypted}$${data.iv}$${data.authTag}`;
  }

  /**
   * Split packed encrypted string back into components
   */
  unpackEncrypted(packed: string): { encrypted: string; iv: string; authTag: string } {
    const parts = packed.split('$');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    return {
      encrypted: parts[0],
      iv: parts[1],
      authTag: parts[2],
    };
  }
}
