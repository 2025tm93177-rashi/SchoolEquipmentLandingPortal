const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const { generateToken, createTokenPayload } = require('../utils/jwtUtils');
const { validateLogin, validatePasswordSetup, checkValidation } = require('../utils/validators');

/**
 * Login
 * POST /api/auth/login
 */
router.post('/login', validateLogin, checkValidation, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await UserModel.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user has set up password
    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Please complete your account setup first. Check your email for the setup link.'
      });
    }

    // Check if account is active
    if (user.status === 'Inactive') {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const tokenPayload = createTokenPayload(user);
    const token = generateToken(tokenPayload);

    // Return user info and token (without password)
    const { password_hash, setup_token, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Setup password (for new users via email link)
 * POST /api/auth/setup-password
 * Note: This is a placeholder. In production, you'd validate the setup_token
 */
router.post('/setup-password', validatePasswordSetup, checkValidation, async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // TODO: Implement token validation
    // For now, this is a placeholder endpoint
    // In production, you would:
    // 1. Validate the setup token
    // 2. Check if token is expired
    // 3. Update the user's password
    // 4. Set status to 'Active'
    // 5. Clear the setup token

    res.status(200).json({
      success: true,
      message: 'Password setup successful. You can now login.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get current user info (requires authentication)
 * GET /api/auth/me
 */
router.get('/me', require('../middleware/auth').authenticate, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { password_hash, setup_token, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
