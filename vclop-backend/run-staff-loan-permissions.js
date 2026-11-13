/**
 * Script to run Staff Loan Permissions SQL
 * This creates all necessary permissions for the Staff Loan module
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runSQLScript() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: 'srv1461.hstgr.io',
      port: 3306,
      user: 'u215495167_vclop',
      password: process.env.DB_PASSWORD || '', // Will prompt if not set
      database: 'u215495167_vclop',
      multipleStatements: true, // Allow multiple SQL statements
    });
    
    console.log('✅ Connected to database');
    
    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'CREATE_STAFF_LOAN_PERMISSIONS.sql');
    console.log('📖 Reading SQL file...');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split by semicolons but keep comments
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'COMMIT');
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('/*') || statement.trim().length < 10) {
        skipCount++;
        continue;
      }
      
      try {
        const [results] = await connection.execute(statement);
        
        // Check if it's a SELECT query (verification)
        if (statement.trim().toUpperCase().startsWith('SELECT')) {
          console.log(`\n📊 Query ${i + 1} Results:`);
          if (Array.isArray(results) && results.length > 0) {
            console.table(results);
          } else {
            console.log('  (No results)');
          }
        } else {
          successCount++;
          if (statement.includes('INSERT')) {
            console.log(`✅ Statement ${i + 1}: Insert successful (${results.affectedRows || 0} rows)`);
          } else {
            console.log(`✅ Statement ${i + 1}: Executed successfully`);
          }
        }
      } catch (error) {
        // Ignore duplicate entry errors (means permission already exists)
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Statement ${i + 1}: Already exists (skipping)`);
          skipCount++;
        } else {
          console.error(`❌ Statement ${i + 1} failed:`, error.message);
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⚠️  Skipped: ${skipCount}`);
    console.log('='.repeat(70));
    
    // Run verification queries
    console.log('\n🔍 Running Verification Queries...\n');
    
    // Check permissions
    const [permissions] = await connection.execute(
      "SELECT name, description, module FROM Permission WHERE name LIKE 'STAFF_LOANS:%' ORDER BY name"
    );
    
    console.log('📋 Staff Loan Permissions Created:');
    if (permissions.length > 0) {
      console.table(permissions);
    } else {
      console.log('⚠️  No staff loan permissions found!');
    }
    
    // Check role assignments
    const [rolePerms] = await connection.execute(`
      SELECT 
        r.name as role_name,
        p.name as permission_name
      FROM RolePermission rp
      JOIN Role r ON rp.roleId = r.id
      JOIN Permission p ON rp.permissionId = p.id
      WHERE p.name LIKE 'STAFF_LOANS:%'
      ORDER BY r.name, p.name
    `);
    
    console.log('\n👥 Permissions Assigned to Roles:');
    if (rolePerms.length > 0) {
      console.table(rolePerms);
    } else {
      console.log('⚠️  No role assignments found! You may need to assign permissions manually.');
    }
    
    console.log('\n🎉 Done! Staff Loan permissions have been set up.');
    console.log('📝 Next step: Restart your frontend to see "My Loans" in the navigation.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Cannot connect to database. Check:');
      console.error('   - Database host is correct');
      console.error('   - Database is running');
      console.error('   - Firewall allows connection');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Access denied. Check:');
      console.error('   - Username is correct');
      console.error('   - Password is correct');
      console.error('   - User has sufficient permissions');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Check if password is provided
if (!process.env.DB_PASSWORD) {
  console.log('⚠️  Database password not set in environment variable.');
  console.log('💡 Run with: DB_PASSWORD=your_password node run-staff-loan-permissions.js');
  console.log('   Or add DB_PASSWORD to your .env file\n');
}

// Run the script
runSQLScript();
