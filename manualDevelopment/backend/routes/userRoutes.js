const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { validateUserCreate, validateUserUpdate, checkValidation } = require('../utils/validators');
const { body } = require('express-validator');

// All user routes require authentication
router.use(authenticate);

/**
 * Change password (any authenticated user)
 * PUT /api/users/change-password
 */
router.put('/change-password', [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
    .notEmpty().withMessage('New password is required')
], userController.changePassword);

/**
 * Get user statistics
 * GET /api/users/stats
 */
router.get('/stats', isAdmin, userController.getUserStats);

/**
 * Get all users (Admin only)
 * GET /api/users
 * Query params: role, status, search, page, limit
 */
router.get('/', isAdmin, userController.getAllUsers);

/**
 * Get user by ID (Admin only)
 * GET /api/users/:id
 */
router.get('/:id', isAdmin, userController.getUserById);

/**
 * Create new user (Admin only)
 * POST /api/users
 */
router.post('/', isAdmin, validateUserCreate, checkValidation, userController.createUser);

/**
 * Update user (Admin only)
 * PUT /api/users/:id
 */
router.put('/:id', isAdmin, validateUserUpdate, checkValidation, userController.updateUser);

/**
 * Delete user (Admin only)
 * DELETE /api/users/:id
 */
router.delete('/:id', isAdmin, userController.deleteUser);

module.exports = router;
