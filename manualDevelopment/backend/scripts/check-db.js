const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../database/school_equipment.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking database...\n');

// Check all users
db.all('SELECT id, email, password_hash, full_name, role, status FROM users', [], (err, rows) => {
  if (err) {
    console.error('Error querying users:', err.message);
    return;
  }

  console.log(`Found ${rows.length} users:\n`);
  
  rows.forEach(user => {
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.full_name}`);
    console.log(`Role: ${user.role}`);
    console.log(`Status: ${user.status}`);
    console.log(`Password Hash: ${user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NULL'}`);
    
    // Test password verification
    if (user.password_hash) {
      const isValid = bcrypt.compareSync('admin123', user.password_hash);
      console.log(`Password Test: ${isValid ? 'VALID' : 'INVALID'}`);
    }
    console.log('---\n');
  });

  db.close();
});
