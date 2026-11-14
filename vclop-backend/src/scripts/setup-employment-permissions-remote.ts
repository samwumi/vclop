/**
 * Setup Employment Workflow Permissions (Remote)
 * Connects to production database and sets up permissions
 * Run from your local system: npm run setup:employment-permissions-remote
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

// Use production database URL
const DATABASE_URL = process.env.DATABASE_URL || process.env.PROD_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: No DATABASE_URL or PROD_DATABASE_URL found in .env');
  console.error('Please add your Hostinger database URL to .env file');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('═'.repeat(70));
  console.log('🚀 Employment Workflow Permissions Setup (Remote)');
  console.log('═'.repeat(70));
  console.log('\n⚠️  This will connect to your PRODUCTION database on Hostinger\n');
  
  // Show connection info (masked)
  const maskedUrl = DATABASE_URL.replace(/:[^:@]+@/, ':****@');
  console.log(`📡 Database: ${maskedUrl}\n`);

  const answer = await askQuestion('Continue? (yes/no): ');
  
  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('\n❌ Cancelled by user');
    rl.close();
    process.exit(0);
  }

  console.log('\n' + '═'.repeat(70));
  console.log('Starting setup...\n');

  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Step 1: Create permissions
    console.log('📝 Creating permissions...');
    
    const permissions = [
      {
        code: 'employees:submit',
        name: 'Submit Employment Data',
        description: 'Submit own employment data for HR review',
        category: 'SYSTEM_ADMINISTRATION' as const,
        module: 'HR',
        action: 'CREATE',
      },
      {
        code: 'employees:review',
        name: 'Review Employment Submissions',
        description: 'View and review pending employment submissions',
        category: 'SYSTEM_ADMINISTRATION' as const,
        module: 'HR',
        action: 'READ',
      },
      {
        code: 'employees:approve',
        name: 'Approve Employment',
        description: 'Approve employment submissions',
        category: 'SYSTEM_ADMINISTRATION' as const,
        module: 'HR',
        action: 'UPDATE',
      },
      {
        code: 'employees:reject',
        name: 'Reject Employment',
        description: 'Reject employment submissions',
        category: 'SYSTEM_ADMINISTRATION' as const,
        module: 'HR',
        action: 'UPDATE',
      },
      {
        code: 'employees:grant_edit',
        name: 'Grant Edit Rights',
        description: 'Grant/revoke edit rights on approved employment data',
        category: 'SYSTEM_ADMINISTRATION' as const,
        module: 'HR',
        action: 'UPDATE',
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
    console.log('👥 Fetching roles from database...');
    const allRoles = await prisma.role.findMany();
    
    if (allRoles.length === 0) {
      console.log('⚠️  No roles found! Create roles first.');
      rl.close();
      return;
    }

    console.log(`   Found ${allRoles.length} roles\n`);

    // Get permission IDs
    const submitPermission = await prisma.permission.findMany({
      where: { code: 'employees:submit' },
    });

    const allEmploymentPermissions = await prisma.permission.findMany({
      where: { code: { startsWith: 'employees:' } },
    });

    // Step 3: Assign submit permission to ALL roles
    console.log('🔑 Granting submit access to all roles...');
    
    for (const role of allRoles) {
      for (const perm of submitPermission) {
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
    console.log(`   ✅ All ${allRoles.length} roles can submit employment data\n`);

    // Step 4: Assign ALL permissions to Admin role
    console.log('🔐 Granting FULL control to Admin role...');
    const adminRoleNames = ['Admin', 'System Administrator'];
    const adminRoles = allRoles.filter(r => 
      adminRoleNames.some(name => r.name.toLowerCase().includes(name.toLowerCase()))
    );

    if (adminRoles.length > 0) {
      console.log(`   Found ${adminRoles.length} admin role(s): ${adminRoles.map(r => r.name).join(', ')}`);
      
      for (const role of adminRoles) {
        for (const perm of allEmploymentPermissions) {
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
      console.log(`   ✅ Admin has ALL employment workflow permissions\n`);
    } else {
      console.log('   ⚠️  No Admin role found. You may need to assign manually.\n');
    }

    // Step 5: Assign HR operational permissions
    console.log('👔 Granting operational access to HR roles...');
    const hrRoleNames = ['HR Manager', 'HR Officer', 'HR Staff'];
    const hrRoles = allRoles.filter(r =>
      hrRoleNames.some(name => r.name.toLowerCase().includes(name.toLowerCase()))
    );

    if (hrRoles.length > 0) {
      console.log(`   Found ${hrRoles.length} HR role(s): ${hrRoles.map(r => r.name).join(', ')}`);
      
      for (const role of hrRoles) {
        for (const perm of allEmploymentPermissions) {
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
      console.log(`   ✅ HR roles have all operational permissions\n`);
    } else {
      console.log('   ⚠️  No HR roles found\n');
    }

    // Step 6: Verification
    console.log('═'.repeat(70));
    console.log('🔍 VERIFICATION');
    console.log('═'.repeat(70));

    const totalPerms = await prisma.permission.count({
      where: { code: { startsWith: 'employees:' } },
    });
    console.log(`\n✅ Total Employment Permissions: ${totalPerms}`);

    const rolePermCounts = await prisma.rolePermission.groupBy({
      by: ['roleId'],
      where: {
        permission: {
          code: { startsWith: 'employees:' },
        },
      },
      _count: true,
    });

    console.log(`✅ Roles with Employment Permissions: ${rolePermCounts.length}\n`);

    // Show detailed breakdown
    console.log('📋 Permission Breakdown by Role:');
    for (const role of allRoles) {
      const perms = await prisma.rolePermission.findMany({
        where: {
          roleId: role.id,
          permission: {
            code: { startsWith: 'employees:' },
          },
        },
        include: {
          permission: true,
        },
      });

      if (perms.length > 0) {
        const accessLevel = perms.length === totalPerms ? '🔑 FULL ACCESS' :
                           perms.length === 1 ? '👤 SELF-SERVICE' :
                           '👔 HR ACCESS';
        
        console.log(`\n   ${role.name} ${accessLevel}:`);
        perms.forEach(rp => {
          console.log(`      • ${rp.permission.code}`);
        });
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('🎉 SETUP COMPLETE!');
    console.log('═'.repeat(70));
    console.log('\n✅ Employment workflow permissions have been created and assigned');
    console.log('📝 Next steps:');
    console.log('   1. Refresh your browser (Ctrl+Shift+R)');
    console.log('   2. Look for "My Employment" in the sidebar under "HR & Staff"');
    console.log('   3. Admin can manage all submissions and delegate permissions\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    rl.close();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    rl.close();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
