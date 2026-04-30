const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Ensure database directory exists
const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'school_equipment.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Promisify database methods for easier use
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Update equipment_requests table schema to ensure all columns exist
const updateEquipmentRequestsSchema = () => {
  console.log('Checking equipment_requests schema...');
  
  db.all("PRAGMA table_info(equipment_requests)", [], (err, columns) => {
    if (err) {
      console.error('Error checking table schema:', err.message);
      return;
    }

    const columnNames = columns.map(col => col.name);
    const updates = [];

    // Check for rejection_reason column
    if (!columnNames.includes('rejection_reason')) {
      updates.push({
        name: 'rejection_reason',
        sql: 'ALTER TABLE equipment_requests ADD COLUMN rejection_reason TEXT'
      });
    }

    // Check for updated_at column
    if (!columnNames.includes('updated_at')) {
      updates.push({
        name: 'updated_at',
        sql: 'ALTER TABLE equipment_requests ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP'
      });
    }

    // Execute updates
    if (updates.length > 0) {
      console.log(`Adding ${updates.length} missing column(s)...`);
      db.serialize(() => {
        updates.forEach(update => {
          db.run(update.sql, (err) => {
            if (err) {
              console.error(`Error adding ${update.name} column:`, err.message);
            } else {
              console.log(`Added ${update.name} column`);
            }
          });
        });
      });
    } else {
      console.log('All required columns already exist');
    }
  });
};

// Initialize database schema
const initializeDatabase = () => {
  console.log('Initializing database...');

  // Create Users table
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('Student', 'Teacher', 'Admin')),
        status TEXT DEFAULT 'Pending Setup' CHECK(status IN ('Pending Setup', 'Active', 'Inactive')),
        phone TEXT,
        department TEXT,
        setup_token TEXT UNIQUE,
        setup_token_expires DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Users table created successfully');
      }
    });

    // Create Equipment table
    db.run(`
      CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        condition TEXT NOT NULL CHECK(condition IN ('Excellent', 'Good', 'Fair', 'Poor', 'Needs Repair')),
        quantity INTEGER NOT NULL DEFAULT 0,
        available_quantity INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating equipment table:', err.message);
      } else {
        console.log('Equipment table created successfully');
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS equipment_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        equipment_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        required_date DATE NULL,
        return_date DATE NULL,
        purpose TEXT NULL,
        status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Denied', 'Returned')),
        approved_by INTEGER NULL,
        approved_date DATETIME NULL,
        denial_reason TEXT NULL,
        rejection_reason TEXT NULL,
        notes TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `, (err) => {
      if (err) {
        console.error('Error creating equipment_requests table:', err.message);
      } else {
        console.log('Equipment requests table ready');
        updateEquipmentRequestsSchema();
      }
    });

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`);

    // Create indexes for equipment
    db.run(`CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_equipment_condition ON equipment(condition)`);

    // Equipment requests indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_requests_user_id ON equipment_requests(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_requests_equipment_id ON equipment_requests(equipment_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_requests_status ON equipment_requests(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_requests_date ON equipment_requests(request_date)`);

    // Seed admin users
    seedAdminUsers();
    
    // Seed equipment
    seedEquipment();
  });
};

// Seed initial admin users
const seedAdminUsers = () => {
  db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
    if (err) {
      console.error('Error checking user count:', err.message);
      return;
    }

    if (row.count === 0) {
      console.log('Seeding initial admin users...');
      
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      console.log('Generated password hash:', hashedPassword.substring(0, 30) + '...');
      
      const sql = `INSERT INTO users (email, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, ?)`;
      
      // Use serialize to ensure all inserts complete before proceeding
      db.serialize(() => {
        db.run(sql, ['admin1@school.edu', hashedPassword, 'Admin One', 'Admin', 'Active'], function(err) {
          if (err) console.error('Error creating admin1:', err.message);
          else console.log('Created admin1@school.edu (ID:', this.lastID, ')');
        });
        
        db.run(sql, ['admin2@school.edu', hashedPassword, 'Admin Two', 'Admin', 'Active'], function(err) {
          if (err) console.error('Error creating admin2:', err.message);
          else console.log('Created admin2@school.edu (ID:', this.lastID, ')');
        });
        
        db.run(sql, ['student@school.edu', hashedPassword, 'John Doe', 'Student', 'Active'], function(err) {
          if (err) console.error('Error creating student:', err.message);
          else console.log('Created student@school.edu (ID:', this.lastID, ')');
        });
        
        db.run(sql, ['teacher@school.edu', hashedPassword, 'Jane Smith', 'Teacher', 'Active'], function(err) {
          if (err) console.error('Error creating teacher:', err.message);
          else console.log('Created teacher@school.edu (ID:', this.lastID, ')');
          
          // Verify the data was actually inserted
          setTimeout(() => {
            db.get('SELECT id, email, password_hash FROM users WHERE email = ?', ['admin1@school.edu'], (err, user) => {
              if (err) {
                console.error('Verification error:', err.message);
              } else if (user) {
                console.log('\nVerification: admin1 password_hash is', user.password_hash ? 'SET' : 'NULL');
                console.log('\nLogin credentials (password for all: admin123):');
                console.log('   Admin: admin1@school.edu');
                console.log('   Admin: admin2@school.edu');
                console.log('   Student: student@school.edu');
                console.log('   Teacher: teacher@school.edu\n');
              } else {
                console.error(' Verification failed: admin1 user not found');
              }
            });
          }, 500);
        });
      });
    } else {
      console.log(`Database already has ${row.count} users - skipping seed`);
      console.log(' To re-seed, delete database and restart, or run: node scripts/force-seed.js\n');
    }
  });
};

// Seed initial equipment
const seedEquipment = () => {
  db.get('SELECT COUNT(*) as count FROM equipment', [], (err, row) => {
    if (err) {
      console.error('Error checking equipment count:', err.message);
      return;
    }

    if (row.count === 0) {
      console.log('Seeding initial equipment...');
      
      const equipment = [
        {
          name: 'MacBook Pro 16"',
          category: 'Laptop',
          condition: 'Excellent',
          quantity: 10,
          available_quantity: 7,
          description: 'Apple MacBook Pro 16" with M2 chip, 16GB RAM'
        },
        {
          name: 'Dell XPS 15',
          category: 'Laptop',
          condition: 'Good',
          quantity: 8,
          available_quantity: 5,
          description: 'Dell XPS 15 with Intel i7, 16GB RAM'
        },
        {
          name: 'iPad Pro 12.9"',
          category: 'Tablet',
          condition: 'Excellent',
          quantity: 15,
          available_quantity: 12,
          description: 'iPad Pro with Apple Pencil support'
        },
        {
          name: 'Epson Projector',
          category: 'Projector',
          condition: 'Good',
          quantity: 5,
          available_quantity: 3,
          description: 'Epson PowerLite projector, 3500 lumens'
        },
        {
          name: 'Canon EOS R5',
          category: 'Camera',
          condition: 'Excellent',
          quantity: 3,
          available_quantity: 2,
          description: 'Professional mirrorless camera with 45MP sensor'
        },
        {
          name: 'Sony A7 III',
          category: 'Camera',
          condition: 'Good',
          quantity: 4,
          available_quantity: 3,
          description: 'Full-frame mirrorless camera'
        },
        {
          name: 'Shure SM58 Microphone',
          category: 'Audio',
          condition: 'Excellent',
          quantity: 12,
          available_quantity: 10,
          description: 'Professional dynamic microphone'
        },
        {
          name: 'Audio-Technica Wireless Mic',
          category: 'Audio',
          condition: 'Good',
          quantity: 6,
          available_quantity: 4,
          description: 'Wireless lavalier microphone system'
        },
        {
          name: 'HP Color LaserJet',
          category: 'Printer',
          condition: 'Good',
          quantity: 4,
          available_quantity: 4,
          description: 'Color laser printer with scanning capability'
        },
        {
          name: 'Wacom Drawing Tablet',
          category: 'Graphics Tablet',
          condition: 'Excellent',
          quantity: 8,
          available_quantity: 6,
          description: 'Professional drawing tablet with pen'
        },
        {
          name: 'USB Document Camera',
          category: 'Camera',
          condition: 'Fair',
          quantity: 10,
          available_quantity: 8,
          description: 'USB document camera for presentations'
        },
        {
          name: 'Portable Whiteboard',
          category: 'Classroom',
          condition: 'Good',
          quantity: 20,
          available_quantity: 15,
          description: 'Portable whiteboard with stand'
        }
      ];

      const insertSql = `
        INSERT INTO equipment (name, category, condition, quantity, available_quantity, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      let inserted = 0;
      db.serialize(() => {
        equipment.forEach((item) => {
          db.run(
            insertSql,
            [item.name, item.category, item.condition, item.quantity, item.available_quantity, item.description],
            function(err) {
              if (err) {
                console.error(`Error inserting ${item.name}:`, err.message);
              } else {
                inserted++;
                console.log(`Created ${item.name} (ID: ${this.lastID})`);
                if (inserted === equipment.length) {
                  console.log(`\n Seeded ${inserted} equipment items\n`);
                }
              }
            }
          );
        });
      });
    } else {
      console.log(`Equipment table already has ${row.count} items - skipping seed\n`);
    }
  });
};

// Initialize database on import
initializeDatabase();

// Export database instance and helper functions
module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll
};
