import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Setting up disbursement permissions...\n');

  // Step 1: Create disbursement permissions
  console.log('📝 Creating permissions...');
  
  const viewPermission = await prisma.permission.upsert({
    where: { code: 'DISBURSEMENTS:VIEW' },
    update: {
      description: 'View all disbursement transactions and their status',
      updatedAt: new Date(),
    },
    create: {
      id: 'disbursement-view-001',
      name: 'View Disbursements',
      code: 'DISBURSEMENTS:VIEW',
      description: 'View all disbursement transactions and their status',
      category: 'DISBURSEMENT_MANAGEMENT',
      module: 'disbursements',
      action: 'view',
      isActive: true,
    },
  });
  console.log(`✅ Created/Updated: ${viewPermission.name}`);

  const retryPermission = await prisma.permission.upsert({
    where: { code: 'DISBURSEMENTS:RETRY' },
    update: {
      description: 'Manually retry failed disbursement transactions',
      updatedAt: new Date(),
    },
    create: {
      id: 'disbursement-retry-001',
      name: 'Retry Failed Disbursements',
      code: 'DISBURSEMENTS:RETRY',
      description: 'Manually retry failed disbursement transactions',
      category: 'DISBURSEMENT_MANAGEMENT',
      module: 'disbursements',
      action: 'retry',
      isActive: true,
    },
  });
  console.log(`✅ Created/Updated: ${retryPermission.name}\n`);

  // Step 2: Assign VIEW permission to Accounting Officer role
  console.log('👤 Assigning permissions to roles...');
  
  const accountingOfficerRole = await prisma.role.findUnique({
    where: { code: 'ACCOUNTING_OFFICER' },
  });

  if (accountingOfficerRole) {
    const existingOfficerPerm = await prisma.rolePermission.findFirst({
      where: {
        roleId: accountingOfficerRole.id,
        permissionId: viewPermission.id,
      },
    });

    if (!existingOfficerPerm) {
      await prisma.rolePermission.create({
        data: {
          roleId: accountingOfficerRole.id,
          permissionId: viewPermission.id,
        },
      });
      console.log(`✅ Assigned VIEW to Accounting Officer`);
    } else {
      console.log(`ℹ️  Accounting Officer already has VIEW permission`);
    }
  } else {
    console.log(`⚠️  Warning: ACCOUNTING_OFFICER role not found`);
  }

  // Step 3: Assign VIEW + RETRY permissions to Accounting Head role
  const accountingHeadRole = await prisma.role.findUnique({
    where: { code: 'ACCOUNTING_HEAD' },
  });

  if (accountingHeadRole) {
    // VIEW permission
    const existingHeadViewPerm = await prisma.rolePermission.findFirst({
      where: {
        roleId: accountingHeadRole.id,
        permissionId: viewPermission.id,
      },
    });

    if (!existingHeadViewPerm) {
      await prisma.rolePermission.create({
        data: {
          roleId: accountingHeadRole.id,
          permissionId: viewPermission.id,
        },
      });
      console.log(`✅ Assigned VIEW to Accounting Head`);
    } else {
      console.log(`ℹ️  Accounting Head already has VIEW permission`);
    }

    // RETRY permission
    const existingHeadRetryPerm = await prisma.rolePermission.findFirst({
      where: {
        roleId: accountingHeadRole.id,
        permissionId: retryPermission.id,
      },
    });

    if (!existingHeadRetryPerm) {
      await prisma.rolePermission.create({
        data: {
          roleId: accountingHeadRole.id,
          permissionId: retryPermission.id,
        },
      });
      console.log(`✅ Assigned RETRY to Accounting Head`);
    } else {
      console.log(`ℹ️  Accounting Head already has RETRY permission`);
    }
  } else {
    console.log(`⚠️  Warning: ACCOUNTING_HEAD role not found`);
  }

  // Step 4: Verify permissions
  console.log('\n📊 Verification:');
  
  const disbursementPermissions = await prisma.permission.findMany({
    where: {
      code: {
        startsWith: 'DISBURSEMENTS:',
      },
    },
  });
  console.log(`✅ ${disbursementPermissions.length} disbursement permissions created`);

  // Show role assignments
  const rolePermissions = await prisma.rolePermission.findMany({
    where: {
      permission: {
        code: {
          startsWith: 'DISBURSEMENTS:',
        },
      },
    },
    include: {
      role: true,
      permission: true,
    },
  });

  if (rolePermissions.length > 0) {
    console.log('\n📋 Role Assignments:');
    for (const rp of rolePermissions) {
      console.log(`   ${rp.role.name} → ${rp.permission.code}`);
    }
  }

  console.log('\n✨ Setup complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
