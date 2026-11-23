/**
 * One-time script to set up leave entitlements for all active users
 * Run with: npm run setup:leave-entitlements
 * OR: npx ts-node --transpile-only src/scripts/setup-leave-entitlements.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupLeaveEntitlements() {
  console.log('🚀 Starting leave entitlements setup...\n');

  try {
    // Get all active users
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    console.log(`📊 Found ${users.length} active users\n`);

    // Get all active leave types
    const leaveTypes = await prisma.leaveType.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        defaultDaysPerYear: true,
      },
    });

    console.log(`📋 Found ${leaveTypes.length} active leave types:`);
    leaveTypes.forEach((lt) => {
      console.log(`   - ${lt.name} (${lt.code}): ${lt.defaultDaysPerYear} days`);
    });
    console.log('');

    const year = new Date().getFullYear();
    let created = 0;
    let skipped = 0;

    console.log(`📅 Creating entitlements for year: ${year}\n`);

    // Create entitlements for each user and leave type
    for (const user of users) {
      const userCreated: string[] = [];
      
      for (const leaveType of leaveTypes) {
        // Check if entitlement already exists
        const existing = await prisma.leaveEntitlement.findFirst({
          where: {
            userId: user.id,
            leaveTypeId: leaveType.id,
            year,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create entitlement with 30 day adjustment to cover any existing applications
        await prisma.leaveEntitlement.create({
          data: {
            user: { connect: { id: user.id } },
            leaveType: { connect: { id: leaveType.id } },
            createdBy: { connect: { id: user.id } },
            year,
            allocatedDays: leaveType.defaultDaysPerYear,
            carryForwardDays: 0,
            adjustmentDays: 30, // Add 30 extra days to cover existing applications
          },
        });

        created++;
        userCreated.push(`${leaveType.code}: ${Number(leaveType.defaultDaysPerYear) + 30} days`);
      }

      if (userCreated.length > 0) {
        console.log(`✅ ${user.username} (${user.email})`);
        userCreated.forEach(item => console.log(`      ${item}`));
      }
    }

    console.log('\n🎉 Setup completed!');
    console.log(`   ✅ Created: ${created} entitlements`);
    console.log(`   ⏭️  Skipped: ${skipped} (already existed)`);
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📋 Leave Types: ${leaveTypes.length}\n`);

    // Show summary
    console.log('📊 Final Summary:');
    const entitlements = await prisma.leaveEntitlement.findMany({
      where: { year },
      include: {
        user: { select: { username: true, email: true } },
        leaveType: { select: { code: true, name: true } },
      },
      take: 10,
    });

    entitlements.forEach((e) => {
      const total = Number(e.allocatedDays) + Number(e.carryForwardDays) + Number(e.adjustmentDays);
      console.log(`   ${e.user.username} - ${e.leaveType.code}: ${total} days available`);
    });

    if (created > 10) {
      console.log(`   ... and ${created - 10} more entitlements\n`);
    }

    // Check for any issues
    const negativeBalances = await prisma.leaveEntitlement.findMany({
      where: {
        year,
        OR: [
          { allocatedDays: { lt: 0 } },
        ],
      },
      include: {
        user: { select: { username: true } },
        leaveType: { select: { name: true } },
      },
    });

    if (negativeBalances.length > 0) {
      console.log('⚠️  Warning: Found users with potential balance issues:');
      negativeBalances.forEach((e) => {
        console.log(`   ${e.user.username} - ${e.leaveType.name}`);
      });
      console.log('   HR can adjust these via the UI at /hr/leaves/entitlements\n');
    } else {
      console.log('✅ All users have positive leave balances!\n');
    }

  } catch (error) {
    console.error('❌ Error setting up leave entitlements:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
setupLeaveEntitlements()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
