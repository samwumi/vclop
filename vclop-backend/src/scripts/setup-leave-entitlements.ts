/**
 * One-time script to set up leave entitlements for all active users
 * Run with: npm run setup-leave-entitlements
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

    const year = 2026;
    let created = 0;
    let skipped = 0;

    // Create entitlements for each user and leave type
    for (const user of users) {
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

        // Create entitlement
        await prisma.leaveEntitlement.create({
          data: {
            user: { connect: { id: user.id } },
            leaveType: { connect: { id: leaveType.id } },
            createdBy: { connect: { id: user.id } },
            year,
            allocatedDays: leaveType.defaultDaysPerYear,
            carryForwardDays: 0,
            adjustmentDays: 0,
          },
        });

        created++;
      }

      console.log(`✅ ${user.username} (${user.email}) - ${leaveTypes.length} entitlements created`);
    }

    console.log('\n🎉 Setup completed!');
    console.log(`   Created: ${created} entitlements`);
    console.log(`   Skipped: ${skipped} (already existed)`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Leave Types: ${leaveTypes.length}\n`);

    // Show summary per user
    console.log('📊 Summary by user:');
    for (const user of users.slice(0, 5)) {
      // Show first 5 users
      const entitlements = await prisma.leaveEntitlement.findMany({
        where: {
          userId: user.id,
          year,
        },
        include: {
          leaveType: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      });

      console.log(`\n   ${user.username}:`);
      entitlements.forEach((e) => {
        console.log(`      - ${e.leaveType.name}: ${e.allocatedDays} days`);
      });
    }

    if (users.length > 5) {
      console.log(`\n   ... and ${users.length - 5} more users`);
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
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
