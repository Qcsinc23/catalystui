import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { generateAccessToken, generateRefreshToken, blacklistToken } from '../../utils/auth';
import User, { 
  createUser, 
  getUserByEmail, 
  getUserById,
  getUserByResetToken,
  updateLastLogin,
  updateUserResetToken,
  updateUserPassword
} from '../../models/User';
import { toAuthUser } from '../../utils/userTransforms';
import { generatePasswordResetEmail, sendEmail } from '../../utils/email';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../config';

// Register a new user
export const register = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10); // Hash password
    const newUser = await createUser({ 
      email, 
      passwordHash,
      role: 'user' as const,
      isActive: true
    });

    const authUser = toAuthUser(newUser);

    // Generate JWT and refresh token
    const accessToken = generateAccessToken(authUser);
    const refreshToken = generateRefreshToken(authUser);

    res.status(201).json({
      user: authUser,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Forgot password request
export const forgotPassword = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email } = req.body;
    const user = await getUserByEmail(email);

    // Always return success even if email doesn't exist (security best practice)
    if (!user) {
      return res.status(200).json({ 
        message: 'If an account exists with this email, you will receive password reset instructions.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token and expiry
    await updateUserResetToken(user.id!, resetToken, resetTokenExpiry);

    // Generate and send reset email
    const emailOptions = generatePasswordResetEmail(email, resetToken);
    await sendEmail(emailOptions);

    res.status(200).json({ 
      message: 'If an account exists with this email, you will receive password reset instructions.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
};

// Reset password with token
export const resetPassword = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { token, newPassword } = req.body;

    // Validate token
    const isValid = await User.isValidResetToken(token);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = await getUserByResetToken(token);
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password and update user
    const passwordHash = await bcrypt.hash(newPassword, config.auth.saltRounds);
    await updateUserPassword(user.id!, passwordHash);

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

// Login an existing user
export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login time
    if (user.id) {
      await updateLastLogin(user.id);
    }

    const authUser = toAuthUser(user);

    // Generate JWT and refresh token
    const accessToken = generateAccessToken(authUser);
    const refreshToken = generateRefreshToken(authUser);

    res.status(200).json({
      user: authUser,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Refresh access token
export const refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token is required' });
    }

    try {
        const decoded = jwt.verify(refreshToken, config.auth.refreshTokenSecret) as { id: number };
        const user = await getUserById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        // Check if user is still active
        if (!user.isActive) {
            return res.status(401).json({ message: 'User account is inactive' });
        }

        const authUser = toAuthUser(user);

        // Generate new access token
        const accessToken = generateAccessToken(authUser);

        res.status(200).json({ accessToken });

    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

// Logout user
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Add the refresh token to the blacklist
    blacklistToken(refreshToken);

    // Clear httpOnly cookie if you're using one
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({ message: 'Successfully logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};
