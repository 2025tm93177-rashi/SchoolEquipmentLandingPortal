const EquipmentModel = require('../models/equipmentModel');
const { validationResult } = require('express-validator');

class EquipmentController {
  // Get all equipment with pagination and filters
  static async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, category, condition, search, available } = req.query;
      
      const filters = {
        category,
        condition,
        search,
        available,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      };

      const [equipment, total] = await Promise.all([
        EquipmentModel.findAll(filters),
        EquipmentModel.count({ category, condition, search, available })
      ]);

      res.json({
        success: true,
        data: equipment,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get equipment by ID
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const equipment = await EquipmentModel.findById(id);

      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: 'Equipment not found'
        });
      }

      res.json({
        success: true,
        data: equipment
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new equipment
  static async create(req, res, next) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, category, condition, quantity, available_quantity, description, image_url } = req.body;

      // Check if equipment with same name exists
      const exists = await EquipmentModel.existsByName(name);
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'Equipment with this name already exists'
        });
      }

      // Create equipment
      const equipment = await EquipmentModel.create({
        name,
        category,
        condition,
        quantity,
        available_quantity: available_quantity !== undefined ? available_quantity : quantity,
        description,
        image_url
      });

      res.status(201).json({
        success: true,
        message: 'Equipment created successfully',
        data: equipment
      });
    } catch (error) {
      next(error);
    }
  }

  // Update equipment
  static async update(req, res, next) {
    try {
      const { id } = req.params;

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      // Check if equipment exists
      const existing = await EquipmentModel.findById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Equipment not found'
        });
      }

      // Check if name is being changed and if new name already exists
      if (req.body.name && req.body.name !== existing.name) {
        const nameExists = await EquipmentModel.existsByName(req.body.name, id);
        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Equipment with this name already exists'
          });
        }
      }

      // Update equipment
      const equipment = await EquipmentModel.update(id, req.body);

      res.json({
        success: true,
        message: 'Equipment updated successfully',
        data: equipment
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete equipment
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      // Check if equipment exists
      const equipment = await EquipmentModel.findById(id);
      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: 'Equipment not found'
        });
      }

      // Check if equipment is currently borrowed (optional - can add later)
      // const borrowed = equipment.quantity - equipment.available_quantity;
      // if (borrowed > 0) {
      //   return res.status(400).json({
      //     success: false,
      //     message: 'Cannot delete equipment that is currently borrowed'
      //   });
      // }

      await EquipmentModel.delete(id);

      res.json({
        success: true,
        message: 'Equipment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get equipment statistics
  static async getStats(req, res, next) {
    try {
      const stats = await EquipmentModel.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all categories
  static async getCategories(req, res, next) {
    try {
      const categories = await EquipmentModel.getCategories();
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = EquipmentController;
