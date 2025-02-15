import { generateAccessToken, generateRefreshToken } from '../auth';
import * as jwt from 'jsonwebtoken';
import config from '../../config';
import { AuthUser, UserRole } from '../../types/auth';

// Mock the entire jsonwebtoken module
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}));

describe('Auth Utils', () => {
  const mockUser: AuthUser = {
    id: 1,
    email: 'test@example.com',
    role: 'user' as UserRole
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('generates an access token with correct payload and options', () => {
      const mockSign = jwt.sign as jest.Mock;
      mockSign.mockReturnValue('mock-access-token');

      const token = generateAccessToken(mockUser);

      expect(mockSign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role
        },
        config.auth.jwtSecret,
        {
          expiresIn: config.auth.jwtExpiresIn
        }
      );
      expect(token).toBe('mock-access-token');
    });
  });

  describe('generateRefreshToken', () => {
    it('generates a refresh token with correct payload and options', () => {
      const mockSign = jwt.sign as jest.Mock;
      mockSign.mockReturnValue('mock-refresh-token');

      const token = generateRefreshToken(mockUser);

      expect(mockSign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role
        },
        config.auth.refreshTokenSecret,
        {
          expiresIn: config.auth.refreshTokenExpiresIn
        }
      );
      expect(token).toBe('mock-refresh-token');
    });
  });
});
