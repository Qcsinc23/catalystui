import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { AppError } from '../../utils/errors';

// Common configuration for all auth rate limiters
const authLimiterConfig = {
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
        throw new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later.');
    },
};

// Login attempts limiter - 5 attempts per 15 minutes
export const loginLimiter = rateLimit({
    ...authLimiterConfig,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts, please try again after 15 minutes',
});

// Registration limiter - 3 attempts per hour
export const registrationLimiter = rateLimit({
    ...authLimiterConfig,
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts
    message: 'Too many registration attempts, please try again after an hour',
});

// Password reset limiter - 3 attempts per hour
export const passwordResetLimiter = rateLimit({
    ...authLimiterConfig,
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts
    message: 'Too many password reset attempts, please try again after an hour',
});

// General API limiter - 100 requests per minute
export const apiLimiter = rateLimit({
    ...authLimiterConfig,
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests
    message: 'Too many requests, please try again after a minute',
});
