const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database/school_equipment.db');

console.log(' NUCLEAR RESET - Complete Database Rebuild\n');

// Step 1: Delete the database file completely
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log(' Deleted old database file\n');
} else {
  console.log('  No existing database file\n');
}

// Step 2: Create fresh database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(' Error creating database:', err.message);
    process.exit(1);
  }
  console.log(' Created new database file\n');
});

// Step 3: Create table with explicit schema
db.serialize(() => {
  console.log(' Creating users table...');
  
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Student', 'Teacher', 'Admin')),
      status TEXT DEFAULT 'Active' CHECK(status IN ('Pending Setup', 'Active', 'Inactive')),
      phone TEXT,
      department TEXT,
      setup_token TEXT UNIQUE,
      setup_token_expires DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error(' Error creating table:', err.message);
      process.exit(1);
    }
    console.log(' Users table created\n');
  });

  // Step 4: Create indexes
  db.run(`CREATE INDEX idx_users_email ON users(email)`);
  db.run(`CREATE INDEX idx_users_role ON users(role)`);
  db.run(`CREATE INDEX idx_users_status ON users(status)`);
  console.log(' Indexes created\n');

  // Step 5: Generate password hash
  console.log(' Generating password hash for "admin123"...');
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  console.log('Generated hash:', hashedPassword);
  console.log('Hash length:', hashedPassword.length);
  console.log('Hash starts with:', hashedPassword.substring(0, 7));
  console.log();

  // Step 6: Insert users ONE BY ONE with verification after each
  const insertSql = `INSERT INTO users (email, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, ?)`;
  
  console.log(' Inserting users...\n');

  // User 1: admin1
  db.run(insertSql, ['admin1@school.edu', hashedPassword, 'Admin One', 'Admin', 'Active'], function(err) {
    if (err) {
      console.error(' Error inserting admin1:', err.message);
    } else {
      console.log(` Inserted admin1@school.edu (ID: ${this.lastID})`);
      
      // Verify immediately
      db.get('SELECT id, email, password_hash FROM users WHERE id = ?', [this.lastID], (err, row) => {
        if (err) console.error('  Verification error:', err.message);
        else if (row && row.password_hash) {
          console.log('  VERIFIED: password_hash is saved');
          const isValid = bcrypt.compareSync('admin123', row.password_hash);
          console.log(' PASSWORD TEST:', isValid ? 'VALID' : 'INVALID');
        } else {
          console.log(' VERIFICATION FAILED: password_hash is NULL or user not found');
        }
        console.log();
      });
    }
  });

  // User 2: admin2
  db.run(insertSql, ['admin2@school.edu', hashedPassword, 'Admin Two', 'Admin', 'Active'], function(err) {
    if (err) {
      console.error(' Error inserting admin2:', err.message);
    } else {
      console.log(` Inserted admin2@school.edu (ID: ${this.lastID})`);
      
      db.get('SELECT id, email, password_hash FROM users WHERE id = ?', [this.lastID], (err, row) => {
        if (err) console.error('  Verification error:', err.message);
        else if (row && row.password_hash) {
          console.log('   VERIFIED: password_hash is saved');
          const isValid = bcrypt.compareSync('admin123', row.password_hash);
          console.log('   PASSWORD TEST:', isValid ? 'VALID' : 'INVALID');
        } else {
          console.log('   VERIFICATION FAILED');
        }
        console.log();
      });
    }
  });

  // User 3: student
  db.run(insertSql, ['student@school.edu', hashedPassword, 'John Doe', 'Student', 'Active'], function(err) {
    if (err) {
      console.error(' Error inserting student:', err.message);
    } else {
      console.log(` Inserted student@school.edu (ID: ${this.lastID})`);
      
      db.get('SELECT id, email, password_hash FROM users WHERE id = ?', [this.lastID], (err, row) => {
        if (err) console.error('  Verification error:', err.message);
        else if (row && row.password_hash) {
          console.log('  VERIFIED: password_hash is saved');
          const isValid = bcrypt.compareSync('admin123', row.password_hash);
          console.log('   PASSWORD TEST:', isValid ? 'VALID' : 'INVALID');
        } else {
          console.log('   VERIFICATION FAILED');
        }
        console.log();
      });
    }
  });

  // User 4: teacher
  db.run(insertSql, ['teacher@school.edu', hashedPassword, 'Jane Smith', 'Teacher', 'Active'], function(err) {
    if (err) {
      console.error(' Error inserting teacher:', err.message);
    } else {
      console.log(` Inserted teacher@school.edu (ID: ${this.lastID})`);
      
      db.get('SELECT id, email, password_hash FROM users WHERE id = ?', [this.lastID], (err, row) => {
        if (err) console.error('  Verification error:', err.message);
        else if (row && row.password_hash) {
          console.log('  VERIFIED: password_hash is saved');
          const isValid = bcrypt.compareSync('admin123', row.password_hash);
          console.log('  PASSWORD TEST:', isValid ? 'VALID' : 'INVALID');
        } else {
          console.log('  VERIFICATION FAILED');
        }
        console.log();
        
        // Final summary after last user
        setTimeout(() => {
          console.log('═══════════════════════════════════════');
          console.log(' FINAL VERIFICATION');
          console.log('═══════════════════════════════════════\n');
          
          db.all('SELECT id, email, password_hash, role, status FROM users', [], (err, rows) => {
            if (err) {
              console.error('Error:', err.message);
              db.close();
              return;
            }
            
            console.log(`Total users: ${rows.length}\n`);
            
            rows.forEach(user => {
              const hasHash = user.password_hash ? 'Yes' : 'No';
              console.log(`${hasHash} ${user.email} (${user.role})`);
              if (user.password_hash) {
                console.log(`   Hash: ${user.password_hash.substring(0, 20)}...`);
              } else {
                console.log(`   Hash: NULL`);
              }
            });
            
            const allHavePasswords = rows.every(u => u.password_hash);
            
            console.log('\n═══════════════════════════════════════');
            if (allHavePasswords) {
              console.log(' SUCCESS! All users have passwords!');
              console.log('═══════════════════════════════════════\n');
              console.log(' You can now start the server:\n');
              console.log('   npm run dev\n');
              console.log(' Login credentials:');
              console.log('   Email: admin1@school.edu');
              console.log('   Password: admin123\n');
            } else {
              console.log(' FAILED! Some users missing passwords!');
              console.log('═══════════════════════════════════════\n');
              console.log('Something is seriously wrong. Please share this output.\n');
            }
            
            db.close();
          });
        }, 2000);
      });
    }
  });
});
