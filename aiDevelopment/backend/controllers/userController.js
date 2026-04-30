const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');

/**
 * Get all users with optional filters
 * GET /api/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;
    
    const filters = {
      role,
      status,
      search,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };

    const users = await UserModel.findAll(filters);
    const totalCount = await UserModel.count({ role, status });

    // Remove password_hash from response
    const sanitizedUsers = users.map(user => {
      const { password_hash, setup_token, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.status(200).json({
      success: true,
      data: sanitizedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password_hash from response
    const { password_hash, setup_token, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user
 * POST /api/users
 */
const createUser = async (req, res, next) => {
  try {
    const { email, password, full_name, role, phone, department } = req.body;

    // Check if email already exists
    const emailExists = await UserModel.emailExists(email);
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password if provided
    let password_hash = null;
    let status = 'Pending Setup';
    
    if (password) {
      password_hash = await bcrypt.hash(password, 10);
      status = 'Active';
    }

    // Create user
    const userData = {
      email,
      password_hash,
      full_name,
      role,
      phone,
      department,
      status
    };

    const newUser = await UserModel.create(userData);

    // Remove password_hash from response
    const { password_hash: _, setup_token, ...userWithoutPassword } = newUser;

    // TODO: Send password setup email if no password provided
    // This would be implemented in Phase 2 with email service

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user exists
    const existingUser = await UserModel.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await UserModel.emailExists(updateData.email, id);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password_hash = await bcrypt.hash(updateData.password, 10);
      updateData.status = 'Active';
      delete updateData.password;
    }

    // Update user
    const updatedUser = await UserModel.update(id, updateData);

    // Remove password_hash from response
    const { password_hash, setup_token, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Delete user
    const deleted = await UserModel.delete(id);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics
 * GET /api/users/stats
 */
const getUserStats = async (req, res, next) => {
  try {
    const stats = {
      total: await UserModel.count(),
      students: await UserModel.count({ role: 'Student' }),
      teachers: await UserModel.count({ role: 'Teacher' }),
      admins: await UserModel.count({ role: 'Admin' }),
      active: await UserModel.count({ status: 'Active' }),
      pending: await UserModel.count({ status: 'Pending Setup' }),
      inactive: await UserModel.count({ status: 'Inactive' })
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Change user password
 * PUT /api/users/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.userId; // From auth middleware
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await UserModel.updatePassword(userId, hashedPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  changePassword
};