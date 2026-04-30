const fs = require('fs');
const path = require('path');

// Path to database file
const dbPath = path.join(__dirname, '../database/school_equipment.db');

// Delete existing database
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log(' Deleted old database file');
} else {
  console.log('  No existing database found');
}

console.log(' Database will be recreated when you start the server');
console.log(' Run: npm run dev');
