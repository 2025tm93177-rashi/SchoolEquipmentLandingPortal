const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../database/school_equipment.db');

console.log('Database Diagnostic Tool\n');
console.log('Database path:', dbPath);
console.log('---\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Cannot open database:', err.message);
    process.exit(1);
  }
  
  console.log(' Database connection opened\n');
  
  // Check if users table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", [], (err, row) => {
    if (err) {
      console.error('Error checking table:', err.message);
      return;
    }
    
    if (!row) {
      console.log(' Users table does NOT exist!');
      console.log('Run: npm run dev (to create tables)\n');
      db.close();
      return;
    }
    
    console.log(' Users table exists\n');
    
    // Get table schema
    db.all("PRAGMA table_info(users)", [], (err, columns) => {
      if (err) {
        console.error('Error getting schema:', err.message);
        return;
      }
      
      console.log('Table Schema:');
      columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}`);
      });
      console.log('\n---\n');
      
      // Get all users
      db.all('SELECT * FROM users', [], (err, users) => {
        if (err) {
          console.error('Error querying users:', err.message);
          db.close();
          return;
        }
        
        console.log(`Found ${users.length} users:\n`);
        
        if (users.length === 0) {
          console.log('  NO USERS IN DATABASE!');
          console.log('Run: node scripts/force-seed.js\n');
          db.close();
          return;
        }
        
        users.forEach((user, index) => {
          console.log(`\n[${index + 1}] User Details:`);
          console.log(`  ID: ${user.id}`);
          console.log(`  Email: ${user.email}`);
          console.log(`  Full Name: ${user.full_name}`);
          console.log(`  Role: ${user.role}`);
          console.log(`  Status: ${user.status}`);
          console.log(`  Phone: ${user.phone || 'null'}`);
          console.log(`  Department: ${user.department || 'null'}`);
          
          // Check password hash
          if (user.password_hash === null || user.password_hash === undefined) {
            console.log(`  Password Hash:  NULL - THIS IS THE PROBLEM!`);
          } else if (user.password_hash === '') {
            console.log(`  Password Hash:  EMPTY STRING`);
          } else {
            console.log(`  Password Hash: EXISTS (${user.password_hash.substring(0, 20)}...)`);
            
            // Test the password
            try {
              const isValid = bcrypt.compareSync('admin123', user.password_hash);
              console.log(`  Password Test ('admin123'): ${isValid ? 'VALID' : ' INVALID'}`);
            } catch (e) {
              console.log(`  Password Test: ERROR - ${e.message}`);
            }
          }
          
          console.log(`  Created: ${user.created_at}`);
          console.log(`  Updated: ${user.updated_at}`);
        });
        
        console.log('\n---\n');
        
        // Summary
        const withPassword = users.filter(u => u.password_hash).length;
        const withoutPassword = users.filter(u => !u.password_hash).length;
        
        console.log(' Summary:');
        console.log(`  Total Users: ${users.length}`);
        console.log(`  With Password: ${withPassword}`);
        console.log(`  Without Password: ${withoutPassword} ${withoutPassword > 0 ? 'No' : 'Yes'}`);
        
        if (withoutPassword > 0) {
          console.log('\n  PROBLEM DETECTED: Some users have NULL password_hash');
          console.log(' FIX: Run this command:');
          console.log('   node scripts/force-seed.js\n');
        } else {
          console.log('\n All users have passwords! Login should work.');
          console.log(' Test login with:');
          console.log('   Email: admin1@school.edu');
          console.log('   Password: admin123\n');
        }
        
        db.close();
      });
    });
  });
});
