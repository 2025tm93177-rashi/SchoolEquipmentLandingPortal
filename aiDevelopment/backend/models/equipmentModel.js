const { db, dbRun, dbGet, dbAll } = require('../config/database');

class EquipmentModel {
  // Create new equipment
  static async create(equipmentData) {
    const { name, category, condition, quantity, available_quantity, description, image_url } = equipmentData;
    
    const sql = `
      INSERT INTO equipment (name, category, condition, quantity, available_quantity, description, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await dbRun(sql, [
      name,
      category,
      condition,
      quantity,
      available_quantity || quantity, // Default available = total quantity
      description || null,
      image_url || null
    ]);
    
    return this.findById(result.lastID);
  }

  // Find equipment by ID
  static async findById(id) {
    const sql = 'SELECT * FROM equipment WHERE id = ?';
    return await dbGet(sql, [id]);
  }

  // Find all equipment with optional filters
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM equipment WHERE 1=1';
    const params = [];

    // Category filter
    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    // Condition filter
    if (filters.condition) {
      query += ' AND condition = ?';
      params.push(filters.condition);
    }

    // Search filter (name or description)
    if (filters.search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    // Availability filter
    if (filters.available === 'true') {
      query += ' AND available_quantity > 0';
    }

    // Order by ID DESC (newest first)
    query += ' ORDER BY id DESC';

    // Pagination
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

  // Count equipment with filters
  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM equipment WHERE 1=1';
    const params = [];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.condition) {
      query += ' AND condition = ?';
      params.push(filters.condition);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.available === 'true') {
      query += ' AND available_quantity > 0';
    }

    const result = await dbGet(query, params);
    return result.total;
  }

  // Update equipment
  static async update(id, equipmentData) {
    const allowedFields = ['name', 'category', 'condition', 'quantity', 'available_quantity', 'description', 'image_url'];
    const updates = [];
    const params = [];

    Object.keys(equipmentData).forEach(key => {
      if (allowedFields.includes(key) && equipmentData[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(equipmentData[key]);
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Add updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `UPDATE equipment SET ${updates.join(', ')} WHERE id = ?`;
    await dbRun(sql, params);
    
    return this.findById(id);
  }

  // Delete equipment
  static async delete(id) {
    const sql = 'DELETE FROM equipment WHERE id = ?';
    const result = await dbRun(sql, [id]);
    return result.changes > 0;
  }

  // Get equipment statistics
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(quantity) as total_quantity,
        SUM(available_quantity) as total_available,
        COUNT(CASE WHEN available_quantity > 0 THEN 1 END) as available_items,
        COUNT(CASE WHEN available_quantity = 0 THEN 1 END) as unavailable_items
      FROM equipment
    `;
    return await dbGet(sql);
  }

  // Get categories
  static async getCategories() {
    const sql = 'SELECT DISTINCT category FROM equipment ORDER BY category';
    const results = await dbAll(sql);
    return results.map(r => r.category);
  }

  // Check if equipment name exists
  static async existsByName(name, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM equipment WHERE name = ?';
    const params = [name];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = await dbGet(sql, params);
    return result.count > 0;
  }
}

module.exports = EquipmentModel;
