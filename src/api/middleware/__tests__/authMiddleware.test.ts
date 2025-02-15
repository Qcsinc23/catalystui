import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { authenticate, authorize } from '../authMiddleware';
import { AppError } from '../../../utils/errors';
import { AuthUser, UserRole } from '../../../types/auth';

// Mock the entire jsonwebtoken module
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  JsonWebTokenError: jest.requireActual('jsonwebtoken').JsonWebTokenError
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should throw AppError if no token is provided', () => {
      authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.any(AppError)
      );
      const error = (nextFunction as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication token is required');
    });

    it('should throw AppError if token is invalid', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.any(AppError)
      );
      const error = (nextFunction as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Invalid or expired token');
    });

    it('should set user on request and call next if token is valid', () => {
      const mockUser: AuthUser = {
        id: 1,
        email: 'test@example.com',
        role: 'user' as UserRole
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockUser);

      authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.user).toEqual(mockUser);
      expect(nextFunction).toHaveBeenCalledWith();
    });
  });

  describe('authorize', () => {
    it('should throw AppError if user is not authenticated', () => {
      const authMiddleware = authorize('admin');
      mockRequest.user = undefined;

      authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.any(AppError)
      );
      const error = (nextFunction as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('User not authenticated');
    });

    it('should throw AppError if user role is not allowed', () => {
      const authMiddleware = authorize('admin');
      mockRequest.user = {
        id: 1,
        email: 'test@example.com',
        role: 'user' as UserRole
      };

      authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.any(AppError)
      );
      const error = (nextFunction as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Insufficient permissions');
    });

    it('should call next if user role is allowed', () => {
      const authMiddleware = authorize('user', 'admin');
      mockRequest.user = {
        id: 1,
        email: 'test@example.com',
        role: 'user' as UserRole
      };

      authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith();
    });
  });
});
