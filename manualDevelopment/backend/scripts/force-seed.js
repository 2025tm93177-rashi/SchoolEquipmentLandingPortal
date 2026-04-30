const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../database/school_equipment.db');
const db = new sqlite3.Database(dbPath);

console.log(' Force Seeding Database...\n');

// Generate a fresh hash
const hashedPassword = bcrypt.hashSync('admin123', 10);
console.log('Generated hash:', hashedPassword.substring(0, 30) + '...\n');

// Delete existing users first
db.run('DELETE FROM users', [], function(err) {
  if (err) {
    console.error('Error deleting users:', err.message);
    return;
  }
  console.log(`Deleted ${this.changes} existing users\n`);

  // Insert users with serialize to ensure order
  db.serialize(() => {
    const sql = `INSERT INTO users (email, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, ?)`;
    
    const users = [
      ['admin1@school.edu', hashedPassword, 'Admin One', 'Admin', 'Active'],
      ['admin2@school.edu', hashedPassword, 'Admin Two', 'Admin', 'Active'],
      ['student@school.edu', hashedPassword, 'John Doe', 'Student', 'Active'],
      ['teacher@school.edu', hashedPassword, 'Jane Smith', 'Teacher', 'Active']
    ];

    users.forEach(userData => {
      db.run(sql, userData, function(err) {
        if (err) {
          console.error(` Error inserting ${userData[0]}:`, err.message);
        } else {
          console.log(` Inserted ${userData[0]} (ID: ${this.lastID})`);
        }
      });
    });

    // Wait a bit then verify
    setTimeout(() => {
      console.log('\n Verifying inserts...\n');
      
      db.all('SELECT id, email, password_hash, role, status FROM users', [], (err, rows) => {
        if (err) {
          console.error('Error querying:', err.message);
          db.close();
          return;
        }

        console.log(`Found ${rows.length} users:\n`);
        
        rows.forEach(user => {
          const hashStatus = user.password_hash ? ' HAS HASH' : ' NULL';
          console.log(`ID: ${user.id} | ${user.email} | ${hashStatus} | ${user.role} | ${user.status}`);
          
          // Test the password
          if (user.password_hash) {
            const isValid = bcrypt.compareSync('admin123', user.password_hash);
            console.log(`  Password test: ${isValid ? ' VALID' : ' INVALID'}`);
          }
        });

        console.log('\n Seeding complete!');
        console.log('\n Test login with:');
        console.log('   Email: admin1@school.edu');
        console.log('   Password: admin123\n');
        
        db.close();
      });
    }, 1000);
  });
});
