import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import config from '../config';
import { AuthUser, JWTUser } from '../types/auth';
import { AppError } from './errors';

// In-memory token blacklist (in production, use Redis or similar)
const tokenBlacklist = new Set<string>();

interface TokenPayload extends JwtPayload, Omit<JWTUser, 'iat' | 'exp'> {}

export const generateAccessToken = (user: AuthUser): string => {
  const options: SignOptions = {
    expiresIn: config.auth.jwtExpiresIn
  };
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    config.auth.jwtSecret,
    options
  );
};

export const generateRefreshToken = (user: AuthUser): string => {
  const options: SignOptions = {
    expiresIn: config.auth.refreshTokenExpiresIn
  };
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    config.auth.refreshTokenSecret,
    options
  );
};

export const validateAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as JWTUser;
    
    // Validate token payload
    if (!decoded.id || !decoded.email || !decoded.role) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid token format');
    }

    // Check token expiration
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      throw new AppError(401, 'UNAUTHORIZED', 'Token has expired');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'UNAUTHORIZED', 'Token has expired');
    }
    throw error;
  }
};

export const validateRefreshToken = (token: string): TokenPayload => {
  try {
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      throw new AppError(401, 'UNAUTHORIZED', 'Token has been revoked');
    }

    const decoded = jwt.verify(token, config.auth.refreshTokenSecret) as JWTUser;
    
    // Validate token payload
    if (!decoded.id || !decoded.email || !decoded.role) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid token format');
    }

    // Check token expiration
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      throw new AppError(401, 'UNAUTHORIZED', 'Token has expired');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'UNAUTHORIZED', 'Token has expired');
    }
    throw error;
  }
};

export const blacklistToken = (token: string): void => {
  tokenBlacklist.add(token);
  
  // Optional: Set up cleanup of expired tokens from blacklist
  const decoded = jwt.decode(token) as JWTUser;
  if (decoded.exp) {
    const timeUntilExpiry = decoded.exp * 1000 - Date.now();
    setTimeout(() => {
      tokenBlacklist.delete(token);
    }, timeUntilExpiry);
  }
};

export const isTokenBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};
