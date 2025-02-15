type JwtExpiration = `${number}${'s' | 'm' | 'h' | 'd'}` | number;

// src/api/routes/authRoutes.ts
import express from 'express';
import { body } from 'express-validator';
import { loginLimiter, registrationLimiter, passwordResetLimiter } from '../middleware/rateLimitMiddleware';
import { register, login, refresh, forgotPassword, resetPassword, logout } from '../controllers/authController';

const router = express.Router();

// --- User Registration ---
router.post(
  '/register',
  registrationLimiter,
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one number')
      .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),
  ],
  register
);

// --- User Login ---
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

// --- Refresh Token ---
router.post('/refresh-token', refresh);

// --- Logout ---
router.post(
  '/logout',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ],
  logout
);

// --- Forgot Password ---
router.post('/forgot-password',
    passwordResetLimiter,
    [
        body('email').isEmail().withMessage('Invalid email format'),
    ],
    forgotPassword
);

// --- Reset Password ---
router.post('/reset-password',
    passwordResetLimiter,
    [
        body('token').notEmpty().withMessage('Token is required'),
        body('newPassword')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
            .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
            .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
            .matches(/[0-9]/).withMessage('Password must contain at least one number')
            .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),
    ],
    resetPassword
);

export default router;
