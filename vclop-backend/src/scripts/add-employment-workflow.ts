import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addWorkflowFields() {
  console.log('🚀 Adding employment submission workflow fields...\n');

  try {
    // 1. Add enum for submission status
    console.log('1. Creating EmploymentSubmissionStatus enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`employment_periods\`
      ADD COLUMN \`submissionStatus\` ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_REVISION') NOT NULL DEFAULT 'DRAFT' AFTER \`isCurrent\`,
      ADD COLUMN \`submittedAt\` DATETIME(3) NULL AFTER \`submissionStatus\`,
      ADD COLUMN \`reviewedAt\` DATETIME(3) NULL AFTER \`submittedAt\`,
      ADD COLUMN \`reviewedById\` VARCHAR(36) NULL AFTER \`reviewedAt\`,
      ADD COLUMN \`reviewNotes\` TEXT NULL AFTER \`reviewedById\`,
      ADD COLUMN \`isEditable\` TINYINT(1) NOT NULL DEFAULT 1 AFTER \`reviewNotes\`;
    `);
    console.log('✅ employment_periods workflow fields added\n');

    // 2. Add workflow fields to employee_guarantors
    console.log('2. Adding workflow fields to employee_guarantors...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`employee_guarantors\`
      ADD COLUMN \`submissionStatus\` ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_REVISION') NOT NULL DEFAULT 'DRAFT' AFTER \`occupation\`,
      ADD COLUMN \`isEditable\` TINYINT(1) NOT NULL DEFAULT 1 AFTER \`submissionStatus\`;
    `);
    console.log('✅ employee_guarantors workflow fields added\n');

    // 3. Add workflow fields to employee_next_of_kin
    console.log('3. Adding workflow fields to employee_next_of_kin...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`employee_next_of_kin\`
      ADD COLUMN \`submissionStatus\` ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_REVISION') NOT NULL DEFAULT 'DRAFT' AFTER \`isPrimary\`,
      ADD COLUMN \`isEditable\` TINYINT(1) NOT NULL DEFAULT 1 AFTER \`submissionStatus\`;
    `);
    console.log('✅ employee_next_of_kin workflow fields added\n');

    // 4. Add foreign key for reviewedById
    console.log('4. Adding foreign key for reviewedById...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`employment_periods\`
      ADD INDEX \`employment_periods_reviewedById_idx\` (\`reviewedById\`);
    `);
    console.log('✅ Foreign key index added\n');

    // 5. Set existing records to APPROVED and read-only (created by HR)
    console.log('5. Setting existing records to APPROVED status...');
    const existingCount = await prisma.$executeRawUnsafe(`
      UPDATE \`employment_periods\`
      SET \`submissionStatus\` = 'APPROVED',
          \`isEditable\` = 0,
          \`reviewedAt\` = NOW(),
          \`submittedAt\` = \`createdAt\`
      WHERE \`submissionStatus\` = 'DRAFT';
    `);
    console.log(`✅ Updated ${existingCount} existing employment records\n`);

    const guarantorCount = await prisma.$executeRawUnsafe(`
      UPDATE \`employee_guarantors\`
      SET \`submissionStatus\` = 'APPROVED',
          \`isEditable\` = 0
      WHERE \`submissionStatus\` = 'DRAFT';
    `);
    console.log(`✅ Updated ${guarantorCount} existing guarantor records\n`);

    const nokCount = await prisma.$executeRawUnsafe(`
      UPDATE \`employee_next_of_kin\`
      SET \`submissionStatus\` = 'APPROVED',
          \`isEditable\` = 0
      WHERE \`submissionStatus\` = 'DRAFT';
    `);
    console.log(`✅ Updated ${nokCount} existing next of kin records\n`);

    // 6. Verify
    console.log('6. Verifying schema changes...');
    const epCols: any[] = await prisma.$queryRawUnsafe(`
      SHOW COLUMNS FROM employment_periods WHERE Field IN ('submissionStatus', 'submittedAt', 'reviewedAt', 'reviewedById', 'reviewNotes', 'isEditable');
    `);
    console.log(`✅ employment_periods: ${epCols.length}/6 fields added`);

    const guCols: any[] = await prisma.$queryRawUnsafe(`
      SHOW COLUMNS FROM employee_guarantors WHERE Field IN ('submissionStatus', 'isEditable');
    `);
    console.log(`✅ employee_guarantors: ${guCols.length}/2 fields added`);

    const nokCols: any[] = await prisma.$queryRawUnsafe(`
      SHOW COLUMNS FROM employee_next_of_kin WHERE Field IN ('submissionStatus', 'isEditable');
    `);
    console.log(`✅ employee_next_of_kin: ${nokCols.length}/2 fields added`);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  - Added submission workflow to employment_periods');
    console.log('  - Added submission workflow to employee_guarantors');
    console.log('  - Added submission workflow to employee_next_of_kin');
    console.log('  - Existing records marked as APPROVED and read-only');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addWorkflowFields()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
