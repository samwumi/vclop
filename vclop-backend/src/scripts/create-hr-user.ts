import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createHRUser() {
  try {
    console.log('🚀 Starting HR user creation...\n');

    // Step 1: Get or create a branch
    console.log('📍 Finding branch...');
    let branch = await prisma.branch.findFirst({
      where: {
        OR: [
          { name: { contains: 'Head Office' } },
          { name: { contains: 'Main' } },
        ],
        deletedAt: null,
      },
    });

    if (!branch) {
      branch = await prisma.branch.findFirst({
        where: { deletedAt: null },
      });
    }

    if (!branch) {
      console.error('❌ No active branch found. Please create a branch first.');
      return;
    }

    console.log(`✅ Using branch: ${branch.name}\n`);

    // Step 2: Check if HR user already exists
    console.log('👤 Checking for existing HR user...');
    const existingUser = await prisma.user.findFirst({
      where: { username: 'hr' },
    });

    if (existingUser) {
      console.log('⚠️  HR user already exists. Skipping user creation.\n');
      console.log('Existing user details:');
      console.log(`  - Username: ${existingUser.username}`);
      console.log(`  - Email: ${existingUser.email}`);
      console.log(`  - Name: ${existingUser.firstName} ${existingUser.lastName}`);
      console.log(`  - Status: ${existingUser.status}\n`);
    } else {
      // Step 3: Create HR user
      console.log('👤 Creating HR user...');
      const hashedPassword = await bcrypt.hash('HR@2024', 10);

      const hrUser = await prisma.user.create({
        data: {
          username: 'hr',
          email: 'hr@verticalcapital.ng',
          firstName: 'HR',
          lastName: 'Manager',
          password: hashedPassword,
          phoneNumber: '08000000000',
          status: 'ACTIVE',
          branchId: branch.id,
        },
      });

      console.log('✅ HR user created successfully!');
      console.log(`  - User ID: ${hrUser.id}`);
      console.log(`  - Username: ${hrUser.username}`);
      console.log(`  - Email: ${hrUser.email}\n`);
    }

    // Get the HR user (whether just created or existing)
    const hrUser = await prisma.user.findUnique({
      where: { username: 'hr' },
    });

    if (!hrUser) {
      console.error('❌ Failed to retrieve HR user.');
      return;
    }

    // Step 4: Create or get HR Manager role
    console.log('🔑 Setting up HR Manager role...');
    let hrRole = await prisma.role.findFirst({
      where: { name: 'HR Manager' },
    });

    if (!hrRole) {
      hrRole = await prisma.role.create({
        data: {
          name: 'HR Manager',
          description:
            'Full access to all HR modules including leaves, staff loans, employment, offboarding',
        },
      });
      console.log('✅ HR Manager role created');
    } else {
      console.log('✅ HR Manager role already exists');
    }

    // Step 5: Assign role to user
    console.log('🔗 Assigning role to HR user...');
    const existingRoleAssignment = await prisma.userRole.findFirst({
      where: {
        userId: hrUser.id,
        roleId: hrRole.id,
      },
    });

    if (!existingRoleAssignment) {
      await prisma.userRole.create({
        data: {
          userId: hrUser.id,
          roleId: hrRole.id,
        },
      });
      console.log('✅ Role assigned to HR user');
    } else {
      console.log('✅ Role already assigned');
    }

    // Step 6: Grant HR permissions
    console.log('\n🔐 Setting up permissions...');

    const permissionCodes = [
      'dashboard:read',
      'users:read',
      'leaves:read',
      'leaves:manage',
      'leaves:approve',
      'employment:read',
      'employment:update',
      'offboarding:read',
      'offboarding:update',
      'staff_loans:read',
      'staff_loans:approve',
      'resources:read',
      'resources:update',
      'reports:read',
    ];

    const permissions = await prisma.permission.findMany({
      where: {
        code: { in: permissionCodes },
      },
    });

    console.log(`Found ${permissions.length} permissions to assign`);

    // Assign permissions to role
    for (const permission of permissions) {
      const existing = await prisma.rolePermission.findFirst({
        where: {
          roleId: hrRole.id,
          permissionId: permission.id,
        },
      });

      if (!existing) {
        await prisma.rolePermission.create({
          data: {
            roleId: hrRole.id,
            permissionId: permission.id,
          },
        });
      }
    }

    console.log('✅ All permissions assigned');

    // Step 7: Display summary
    console.log('\n' + '='.repeat(70));
    console.log('🎉 HR USER SETUP COMPLETE!');
    console.log('='.repeat(70));

    const userWithDetails = await prisma.user.findUnique({
      where: { id: hrUser.id },
      include: {
        branch: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log('\n📋 USER DETAILS:');
    console.log(`  Username:  ${userWithDetails?.username}`);
    console.log(`  Email:     ${userWithDetails?.email}`);
    console.log(`  Name:      ${userWithDetails?.firstName} ${userWithDetails?.lastName}`);
    console.log(`  Branch:    ${userWithDetails?.branch?.name}`);
    console.log(`  Status:    ${userWithDetails?.status}`);

    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('  ┌────────────────────────────────────────────────────┐');
    console.log('  │  Username:  hr                                     │');
    console.log('  │  Password:  HR@2024                                │');
    console.log('  │  Email:     hr@verticalcapital.ng                  │');
    console.log('  └────────────────────────────────────────────────────┘');

    console.log('\n📌 ASSIGNED ROLES:');
    userWithDetails?.userRoles.forEach((ur) => {
      console.log(`  - ${ur.role.name}`);
    });

    console.log('\n🔐 ASSIGNED PERMISSIONS:');
    const allPermissions = userWithDetails?.userRoles.flatMap(
      (ur) => ur.role.rolePermissions.map((rp) => rp.permission.code)
    ) || [];
    const uniquePermissions = [...new Set(allPermissions)].sort();
    
    uniquePermissions.forEach((perm) => {
      console.log(`  ✓ ${perm}`);
    });

    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n✅ Script completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error creating HR user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createHRUser()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
