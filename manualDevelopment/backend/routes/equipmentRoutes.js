const express = require('express');
const router = express.Router();
const EquipmentController = require('../controllers/equipmentController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation rules
const equipmentValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('category')
      .trim()
      .notEmpty().withMessage('Category is required'),
    body('condition')
      .notEmpty().withMessage('Condition is required')
      .isIn(['Excellent', 'Good', 'Fair', 'Poor', 'Needs Repair'])
      .withMessage('Invalid condition value'),
    body('quantity')
      .isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('available_quantity')
      .optional()
      .isInt({ min: 0 }).withMessage('Available quantity must be a non-negative integer')
      .custom((value, { req }) => {
        if (value > req.body.quantity) {
          throw new Error('Available quantity cannot exceed total quantity');
        }
        return true;
      }),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('image_url')
      .optional()
      .trim()
      .isURL().withMessage('Image URL must be valid')
  ],
  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('category')
      .optional()
      .trim()
      .notEmpty().withMessage('Category cannot be empty'),
    body('condition')
      .optional()
      .isIn(['Excellent', 'Good', 'Fair', 'Poor', 'Needs Repair'])
      .withMessage('Invalid condition value'),
    body('quantity')
      .optional()
      .isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('available_quantity')
      .optional()
      .isInt({ min: 0 }).withMessage('Available quantity must be a non-negative integer'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('image_url')
      .optional()
      .trim()
      .isURL().withMessage('Image URL must be valid')
  ]
};

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/equipment
 * @desc    Get all equipment with pagination and filters
 * @access  Private (All authenticated users)
 */
router.get('/', EquipmentController.getAll);

/**
 * @route   GET /api/equipment/stats
 * @desc    Get equipment statistics
 * @access  Private (Admin only)
 */
router.get('/stats', isAdmin, EquipmentController.getStats);

/**
 * @route   GET /api/equipment/categories
 * @desc    Get all equipment categories
 * @access  Private (All authenticated users)
 */
router.get('/categories', EquipmentController.getCategories);

/**
 * @route   GET /api/equipment/:id
 * @desc    Get equipment by ID
 * @access  Private (All authenticated users)
 */
router.get('/:id', EquipmentController.getById);

/**
 * @route   POST /api/equipment
 * @desc    Create new equipment
 * @access  Private (Admin only)
 */
router.post('/', isAdmin, equipmentValidation.create, EquipmentController.create);

/**
 * @route   PUT /api/equipment/:id
 * @desc    Update equipment
 * @access  Private (Admin only)
 */
router.put('/:id', isAdmin, equipmentValidation.update, EquipmentController.update);

/**
 * @route   DELETE /api/equipment/:id
 * @desc    Delete equipment
 * @access  Private (Admin only)
 */
router.delete('/:id', isAdmin, EquipmentController.delete);

module.exports = router;