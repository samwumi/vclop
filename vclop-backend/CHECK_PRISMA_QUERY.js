// Run this with: node CHECK_PRISMA_QUERY.js
// This checks if Prisma can see your employment record

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmployment() {
  try {
    console.log('🔍 Checking employment record for samwumi91@gmail.com...\n');

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: 'samwumi91@gmail.com' }
    });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('✅ User found:', user.id, user.firstName, user.lastName);

    // Check employment with Prisma (exactly like the API does)
    const employment = await prisma.employmentPeriod.findFirst({
      where: {
        userId: user.id,
        isCurrent: true,
      },
      include: {
        department: true,
        branch: true,
      },
    });

    if (!employment) {
      console.log('❌ No current employment found with Prisma query!');
      console.log('\nChecking all employment records...');
      
      const allEmployment = await prisma.employmentPeriod.findMany({
        where: { userId: user.id }
      });
      
      console.log(`Found ${allEmployment.length} total employment record(s):`);
      allEmployment.forEach(e => {
        console.log(`  - ID: ${e.id}`);
        console.log(`    isCurrent: ${e.isCurrent}`);
        console.log(`    jobTitle: ${e.jobTitle}`);
      });
      
      return;
    }

    console.log('✅ Current employment found!');
    console.log('   ID:', employment.id);
    console.log('   Job Title:', employment.jobTitle);
    console.log('   Department:', employment.department?.name);
    console.log('   Branch:', employment.branch?.name);
    console.log('   isCurrent:', employment.isCurrent);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployment();
