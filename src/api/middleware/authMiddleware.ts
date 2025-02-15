import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError } from '../../utils/errors';
import { UserRole } from '../../types/auth';
import { AuthenticatedRequest } from '../../types/request';
import { validateAccessToken, isTokenBlacklisted } from '../../utils/auth';

export const authenticate: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Bearer token is required');
    }

    const token = authHeader.split(' ')[1];
    
    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      throw new AppError(401, 'UNAUTHORIZED', 'Token has been revoked');
    }

    // Validate token and get decoded payload
    const decoded = validateAccessToken(token);

    // Set user in request
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...allowedRoles: UserRole[]): RequestHandler => 
  (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    
    try {
      if (!authReq.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(authReq.user.role)) {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
