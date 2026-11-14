import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTables() {
  console.log('🔍 Verifying new tables...\n');

  try {
    // Check employee_guarantors structure
    console.log('📋 employee_guarantors columns:');
    const guarantorCols: any[] = await prisma.$queryRawUnsafe(`
      SHOW COLUMNS FROM employee_guarantors;
    `);
    guarantorCols.forEach((col) => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Check employee_next_of_kin structure
    console.log('\n📋 employee_next_of_kin columns:');
    const nokCols: any[] = await prisma.$queryRawUnsafe(`
      SHOW COLUMNS FROM employee_next_of_kin;
    `);
    nokCols.forEach((col) => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Check indexes
    console.log('\n🔑 Indexes on employee_guarantors:');
    const guarantorIndexes: any[] = await prisma.$queryRawUnsafe(`
      SHOW INDEXES FROM employee_guarantors;
    `);
    guarantorIndexes.forEach((idx) => {
      console.log(`  - ${idx.Key_name} on ${idx.Column_name}`);
    });

    console.log('\n🔑 Indexes on employee_next_of_kin:');
    const nokIndexes: any[] = await prisma.$queryRawUnsafe(`
      SHOW INDEXES FROM employee_next_of_kin;
    `);
    nokIndexes.forEach((idx) => {
      console.log(`  - ${idx.Key_name} on ${idx.Column_name}`);
    });

    console.log('\n✅ All tables verified and ready to use!');
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyTables()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
