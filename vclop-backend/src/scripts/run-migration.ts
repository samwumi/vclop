import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🚀 Starting migration: Add employee_guarantors and employee_next_of_kin tables...\n');

  try {
    // Create employee_guarantors table
    console.log('Creating employee_guarantors table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`employee_guarantors\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`employmentPeriodId\` VARCHAR(36) NOT NULL,
        \`firstName\` VARCHAR(100) NOT NULL,
        \`lastName\` VARCHAR(100) NOT NULL,
        \`phone\` VARCHAR(20) NOT NULL,
        \`email\` VARCHAR(150) NULL,
        \`relationship\` VARCHAR(100) NOT NULL,
        \`address\` VARCHAR(500) NULL,
        \`occupation\` VARCHAR(150) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        INDEX \`employee_guarantors_employmentPeriodId_idx\` (\`employmentPeriodId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ employee_guarantors table created\n');

    // Create employee_next_of_kin table
    console.log('Creating employee_next_of_kin table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`employee_next_of_kin\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`employmentPeriodId\` VARCHAR(36) NOT NULL,
        \`firstName\` VARCHAR(100) NOT NULL,
        \`lastName\` VARCHAR(100) NOT NULL,
        \`phone\` VARCHAR(20) NOT NULL,
        \`email\` VARCHAR(150) NULL,
        \`relationship\` VARCHAR(100) NOT NULL,
        \`address\` VARCHAR(500) NULL,
        \`isPrimary\` TINYINT(1) NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        INDEX \`employee_next_of_kin_employmentPeriodId_idx\` (\`employmentPeriodId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ employee_next_of_kin table created\n');

    // Verify tables exist
    console.log('Verifying tables...');
    const tables: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        TABLE_NAME,
        TABLE_ROWS,
        CREATE_TIME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('employee_guarantors', 'employee_next_of_kin')
      ORDER BY TABLE_NAME;
    `);

    console.log('\n📊 Tables verified:');
    tables.forEach((table) => {
      console.log(`  - ${table.TABLE_NAME}: ${table.TABLE_ROWS} rows, created at ${table.CREATE_TIME}`);
    });

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
