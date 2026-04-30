const { body, param, validationResult } = require('express-validator');

/**
 * Validation rules for user creation
 */
const validateUserCreate = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('role')
    .isIn(['Student', 'Teacher', 'Admin'])
    .withMessage('Role must be Student, Teacher, or Admin'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-()]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters'),
  
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

/**
 * Validation rules for user update
 */
const validateUserUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid user ID'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('role')
    .optional()
    .isIn(['Student', 'Teacher', 'Admin'])
    .withMessage('Role must be Student, Teacher, or Admin'),
  
  body('status')
    .optional()
    .isIn(['Pending Setup', 'Active', 'Inactive'])
    .withMessage('Status must be Pending Setup, Active, or Inactive'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-()]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters')
];

/**
 * Validation rules for login
 */
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation rules for password setup
 */
const validatePasswordSetup = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match')
];

/**
 * Middleware to check validation results
 */
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

module.exports = {
  validateUserCreate,
  validateUserUpdate,
  validateLogin,
  validatePasswordSetup,
  checkValidation
};
