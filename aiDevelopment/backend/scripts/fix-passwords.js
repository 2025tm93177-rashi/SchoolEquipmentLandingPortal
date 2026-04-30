const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../database/school_equipment.db');
const db = new sqlite3.Database(dbPath);

console.log(' Fixing user passwords...\n');

const hashedPassword = bcrypt.hashSync('admin123', 10);

const emails = [
  'admin1@school.edu',
  'admin2@school.edu',
  'student@school.edu',
  'teacher@school.edu'
];

const updateSql = `UPDATE users SET password_hash = ?, status = 'Active' WHERE email = ?`;

db.serialize(() => {
  emails.forEach(email => {
    db.run(updateSql, [hashedPassword, email], function(err) {
      if (err) {
        console.error(` Error updating ${email}:`, err.message);
      } else if (this.changes > 0) {
        console.log(` Updated password for ${email}`);
      } else {
        console.log(`  User ${email} not found`);
      }
    });
  });

  // Verify after updates
  setTimeout(() => {
    db.all('SELECT email, password_hash, status FROM users', [], (err, rows) => {
      if (err) {
        console.error('Error:', err.message);
        return;
      }

      console.log('\n Final Status:');
      rows.forEach(user => {
        console.log(`${user.email}: ${user.password_hash ? 'Has Password' : ' No Password'} | Status: ${user.status}`);
      });

      console.log('\n All done! Try logging in now.');
      db.close();
    });
  }, 1000);
});
