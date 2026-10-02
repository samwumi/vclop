import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service';

/**
 * CommonModule - Shared services used across the application
 * Marked as @Global so it's available everywhere without explicit imports
 */
@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class CommonModule {}
