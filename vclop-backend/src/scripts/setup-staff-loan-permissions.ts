/**
 * Setup Staff Loan Permissions
 * Creates all necessary permissions and assigns them to roles
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Setting up Staff Loan Permissions...\n');

  try {
    // Step 1: Create permissions
    console.log('📝 Creating permissions...');
    
    const permissions = [
      {
        code: 'STAFF_LOANS:VIEW_OWN',
        name: 'View Own Staff Loans',
        description: 'View own staff loan applications',
        category: 'SYSTEM_ADMINISTRATION' as const,
        module: 'HR',
        action: 'READ',
      },
      {
        code: 'STAFF_LOANS:APPLY',
        name: 'Apply for Staff Loan',
        description: 'Apply for staff loan',
        category: 'SYSTEM_ADMINISTRATION' as const,
        module: 'HR',
        action: 'CREATE',
      },
      {
        code: 'STAFF_LOANS:VIEW_ALL',
        name: 'View All Staff Loans',
        description: 'View all staff loan applications',
        category: 'SYSTEM_ADMINISTRATION' as const,
        module: 'HR',
        action: 'READ',
      },
      {
        code: 'STAFF_LOANS:APPROVE',
        name: 'Approve Staff Loans',
        description: 'Approve staff loan applications',
        category: 'SYSTEM_ADMINISTRATION' as const,
        module: 'HR',
        action: 'UPDATE',
      },
      {
        code: 'STAFF_LOANS:REJECT',
        name: 'Reject Staff Loans',
        description: 'Reject staff loan applications',
        category: 'SYSTEM_ADMINISTRATION' as const,
        module: 'HR',
        action: 'UPDATE',
      },
      {
        code: 'STAFF_LOANS:DISBURSE',
        name: 'Disburse Staff Loans',
        description: 'Disburse approved staff loans',
        category: 'SYSTEM_ADMINISTRATION' as const,
        module: 'HR',
        action: 'UPDATE',
      },
      {
        code: 'STAFF_LOANS:RECORD_PAYMENT',
        name: 'Record Staff Loan Payment',
        description: 'Record staff loan payments',
        category: 'SYSTEM_ADMINISTRATION' as const,
        module: 'HR',
        action: 'CREATE',
      },
      {
        code: 'STAFF_LOANS:REVERSE_PAYMENT',
        name: 'Reverse Staff Loan Payment',
        description: 'Reverse staff loan payments',
        category: 'SYSTEM_ADMINISTRATION' as const,
        module: 'HR',
        action: 'DELETE',
      },
      {
        code: 'STAFF_LOANS:EXPORT',
        name: 'Export Staff Loan Reports',
        description: 'Export staff loan reports',
        category: 'SYSTEM_ADMINISTRATION' as const,
        module: 'HR',
        action: 'READ',
      },
    ];

    let createdCount = 0;
    let existingCount = 0;

    for (const perm of permissions) {
      try {
        await prisma.permission.create({
          data: perm,
        });
        console.log(`  ✅ ${perm.code}`);
        createdCount++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`  ⚠️  ${perm.code} (already exists)`);
          existingCount++;
        } else {
          console.error(`  ❌ ${perm.code}: ${error.message}`);
        }
      }
    }

    console.log(`\n📊 Permissions: ${createdCount} created, ${existingCount} existing\n`);

    // Step 2: Get all roles
    console.log('👥 Assigning permissions to roles...');
    const allRoles = await prisma.role.findMany();
    
    if (allRoles.length === 0) {
      console.log('⚠️  No roles found! Create roles first.');
      return;
    }

    console.log(`   Found ${allRoles.length} roles\n`);

    // Get permission IDs
    const employeePermissions = await prisma.permission.findMany({
      where: {
        code: { in: ['STAFF_LOANS:VIEW_OWN', 'STAFF_LOANS:APPLY'] },
      },
    });

    const allStaffLoanPermissions = await prisma.permission.findMany({
      where: {
        code: { startsWith: 'STAFF_LOANS:' },
      },
    });

    // Step 3: Assign employee permissions to ALL roles
    console.log('🔑 Granting basic access to all roles...');
    let employeeAssignCount = 0;
    
    for (const role of allRoles) {
      for (const perm of employeePermissions) {
        try {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: perm.id,
            },
          });
          employeeAssignCount++;
        } catch (error: any) {
          if (error.code !== 'P2002') {
            console.error(`  Error assigning ${perm.code} to ${role.name}`);
          }
        }
      }
    }
    console.log(`   ✅ Assigned employee permissions to ${allRoles.length} roles\n`);

    // Step 4: Assign admin permissions to specific roles
    console.log('🔐 Granting admin access to HR/Admin roles...');
    const adminRoleNames = ['HR Manager', 'Admin', 'System Administrator', 'HR Officer'];
    const adminRoles = allRoles.filter(r => 
      adminRoleNames.some(name => r.name.toLowerCase().includes(name.toLowerCase()))
    );

    if (adminRoles.length > 0) {
      console.log(`   Found ${adminRoles.length} admin role(s): ${adminRoles.map(r => r.name).join(', ')}`);
      
      let adminAssignCount = 0;
      for (const role of adminRoles) {
        for (const perm of allStaffLoanPermissions) {
          try {
            await prisma.rolePermission.create({
              data: {
                roleId: role.id,
                permissionId: perm.id,
              },
            });
            adminAssignCount++;
          } catch (error: any) {
            if (error.code !== 'P2002') {
              console.error(`  Error assigning ${perm.code} to ${role.name}`);
            }
          }
        }
      }
      console.log(`   ✅ Assigned all permissions to admin roles\n`);
    } else {
      console.log('   ⚠️  No HR/Admin roles found. You may need to assign manually.\n');
    }

    // Step 5: Assign finance permissions
    console.log('💰 Granting finance access to Finance roles...');
    const financeRoleNames = ['Finance Officer', 'Accounting Officer', 'Finance Manager'];
    const financeRoles = allRoles.filter(r =>
      financeRoleNames.some(name => r.name.toLowerCase().includes(name.toLowerCase()))
    );

    const financePermissions = await prisma.permission.findMany({
      where: {
        code: {
          in: [
            'STAFF_LOANS:VIEW_ALL',
            'STAFF_LOANS:DISBURSE',
            'STAFF_LOANS:RECORD_PAYMENT',
            'STAFF_LOANS:EXPORT',
          ],
        },
      },
    });

    if (financeRoles.length > 0) {
      console.log(`   Found ${financeRoles.length} finance role(s): ${financeRoles.map(r => r.name).join(', ')}`);
      
      for (const role of financeRoles) {
        for (const perm of financePermissions) {
          try {
            await prisma.rolePermission.create({
              data: {
                roleId: role.id,
                permissionId: perm.id,
              },
            });
          } catch (error: any) {
            if (error.code !== 'P2002') {
              console.error(`  Error assigning ${perm.code} to ${role.name}`);
            }
          }
        }
      }
      console.log(`   ✅ Assigned finance permissions\n`);
    } else {
      console.log('   ⚠️  No Finance roles found\n');
    }

    // Step 6: Verification
    console.log('═'.repeat(70));
    console.log('🔍 VERIFICATION');
    console.log('═'.repeat(70));

    const totalPerms = await prisma.permission.count({
      where: { code: { startsWith: 'STAFF_LOANS:' } },
    });
    console.log(`\n✅ Total Staff Loan Permissions: ${totalPerms}`);

    const rolePermCounts = await prisma.rolePermission.groupBy({
      by: ['roleId'],
      where: {
        permission: {
          code: { startsWith: 'STAFF_LOANS:' },
        },
      },
      _count: true,
    });

    console.log(`✅ Roles with Staff Loan Permissions: ${rolePermCounts.length}\n`);

    // Show detailed breakdown
    console.log('📋 Permission Breakdown by Role:');
    for (const role of allRoles) {
      const perms = await prisma.rolePermission.findMany({
        where: {
          roleId: role.id,
          permission: {
            code: { startsWith: 'STAFF_LOANS:' },
          },
        },
        include: {
          permission: true,
        },
      });

      if (perms.length > 0) {
        console.log(`\n   ${role.name}:`);
        perms.forEach(rp => {
          console.log(`      • ${rp.permission.code}`);
        });
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('🎉 SETUP COMPLETE!');
    console.log('═'.repeat(70));
    console.log('\n✅ Staff Loan permissions have been created and assigned');
    console.log('📝 Next: Restart your frontend to see "My Loans" in the navigation\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
