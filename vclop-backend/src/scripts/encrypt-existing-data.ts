import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../common/services/encryption.service';
import { ConfigService } from '@nestjs/config';

/**
 * Script to encrypt existing BVN/NIN data
 * Run once after adding encryption fields
 * 
 * Usage: npx ts-node src/scripts/encrypt-existing-data.ts
 */

async function main() {
  const prisma = new PrismaClient();
  const configService = new ConfigService();
  const encryptionService = new EncryptionService(configService);

  console.log('🔒 Starting encryption of existing customer data...\n');

  try {
    // Find all customers with plain BVN/NIN but no encrypted version
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { AND: [{ bvn: { not: null } }, { bvnEncrypted: null }] },
          { AND: [{ nin: { not: null } }, { ninEncrypted: null }] },
        ],
      },
      select: {
        id: true,
        customerNumber: true,
        bvn: true,
        nin: true,
        bvnEncrypted: true,
        ninEncrypted: true,
      },
    });

    console.log(`Found ${customers.length} customers with unencrypted data\n`);

    if (customers.length === 0) {
      console.log('✅ No customers need encryption. All done!');
      return;
    }

    let encrypted = 0;
    let errors = 0;

    for (const customer of customers) {
      try {
        const updates: any = {};

        // Encrypt BVN if exists and not already encrypted
        if (customer.bvn && !customer.bvnEncrypted) {
          const encryptedBvn = encryptionService.encrypt(customer.bvn);
          updates.bvnEncrypted = encryptionService.packEncrypted(encryptedBvn);
          updates.encryptionKeyVersion = 1;
        }

        // Encrypt NIN if exists and not already encrypted
        if (customer.nin && !customer.ninEncrypted) {
          const encryptedNin = encryptionService.encrypt(customer.nin);
          updates.ninEncrypted = encryptionService.packEncrypted(encryptedNin);
          updates.encryptionKeyVersion = 1;
        }

        // Update customer with encrypted data
        if (Object.keys(updates).length > 0) {
          await prisma.customer.update({
            where: { id: customer.id },
            data: updates,
          });
          encrypted++;
          console.log(`✓ Encrypted ${customer.customerNumber}`);
        }
      } catch (error) {
        errors++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`✗ Error encrypting ${customer.customerNumber}:`, errorMessage);
      }
    }

    console.log(`\n📊 Encryption Summary:`);
    console.log(`   - Total customers processed: ${customers.length}`);
    console.log(`   - Successfully encrypted: ${encrypted}`);
    console.log(`   - Errors: ${errors}`);

    if (errors === 0) {
      console.log(`\n✅ All customer data encrypted successfully!`);
      console.log(`\n⚠️  NEXT STEPS:`);
      console.log(`   1. Verify encrypted data works correctly`);
      console.log(`   2. Test decryption in the application`);
      console.log(`   3. After testing, you can drop the plain bvn/nin columns:`);
      console.log(`      ALTER TABLE customers DROP COLUMN bvn, DROP COLUMN nin;`);
      console.log(`   4. Update application code to use bvnEncrypted/ninEncrypted only`);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
