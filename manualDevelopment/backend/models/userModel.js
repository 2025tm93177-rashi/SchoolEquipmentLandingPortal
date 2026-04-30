const { db, dbRun, dbGet, dbAll } = require('../config/database');

class UserModel {
  // Create a new user
  static async create(userData) {
    const { email, password_hash, full_name, role, phone, department, status } = userData;
    
    const sql = `
      INSERT INTO users (email, password_hash, full_name, role, phone, department, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await dbRun(sql, [
      email,
      password_hash || null,
      full_name,
      role,
      phone || null,
      department || null,
      status || 'Pending Setup'
    ]);
    
    return this.findById(result.lastID);
  }

  // Find user by ID
  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    return await dbGet(sql, [id]);
  }

  // Find user by email
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    return await dbGet(sql, [email]);
  }

  // Get all users with optional filters
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (full_name LIKE ? OR email LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY id DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    return await dbAll(query, params);
  }

  // Update user
  static async update(id, userData) {
    const allowedFields = ['email', 'password_hash', 'full_name', 'role', 'phone', 'department', 'status'];
    const updates = [];
    const params = [];

    Object.keys(userData).forEach(key => {
      if (allowedFields.includes(key) && userData[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(userData[key]);
      }
    });

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await dbRun(query, params);

    return this.findById(id);
  }

  // Delete user
  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    const result = await dbRun(sql, [id]);
    return result.changes > 0;
  }

  // Count users
  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const params = [];

    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    const result = await dbGet(query, params);
    return result.count;
  }

  // Update password
  static async updatePassword(id, password_hash) {
    const sql = `
      UPDATE users 
      SET password_hash = ?, status = 'Active', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    await dbRun(sql, [password_hash, id]);
    return this.findById(id);
  }

  // Check if email exists
  static async emailExists(email, excludeId = null) {
    let query = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
    const params = [email];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const result = await dbGet(query, params);
    return result.count > 0;
  }
}

module.exports = UserModel;
