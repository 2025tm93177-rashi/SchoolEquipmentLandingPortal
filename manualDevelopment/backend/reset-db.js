const fs = require('fs');
const path = require('path');

// Path to database file
const dbPath = path.join(__dirname, 'database', 'school_equipment.db');

// Delete the database file if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Deleted existing database');
}

console.log('Reinitializing database...');
console.log('Please restart the server with: npm run dev');
console.log('');

// The database will be recreated when server starts
process.exit(0);
