import { jest } from '@jest/globals';
import {
  createLogger,
  logError,
  logWarning,
  logInfo,
  logDebug,
  logPerformance,
  logSecurityEvent,
} from '../logger';

type MockLogger = {
  error: jest.Mock;
  warn: jest.Mock;
  info: jest.Mock;
  debug: jest.Mock;
  child: jest.Mock;
};

const createMockLogger = (): MockLogger => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
});

// Mock pino
let mockLogger: MockLogger;

jest.mock('pino', () => {
  const mockPinoFactory = jest.fn(() => mockLogger);
  (mockPinoFactory as any).transport = jest.fn(() => ({}));
  (mockPinoFactory as any).stdSerializers = {
    err: jest.fn((err: Error) => ({ message: err.message, stack: err.stack })),
    req: jest.fn(),
    res: jest.fn(),
  };
  (mockPinoFactory as any).stdTimeFunctions = {
    isoTime: jest.fn(),
  };
  return mockPinoFactory;
});

describe('Logger Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = createMockLogger();
  });

  describe('createLogger', () => {
    it('should create a child logger with context', () => {
      const testContext = 'test-context';
      createLogger(testContext);

      expect(mockLogger.child).toHaveBeenCalledWith({ context: testContext });
    });
  });

  describe('logError', () => {
    it('should log errors with context and additional info', () => {
      const testError = new Error('Test error');
      const testContext = 'test-context';
      const additionalInfo = { userId: 123 };

      logError(testError, testContext, additionalInfo);

      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          err: testError,
          context: testContext,
          userId: 123,
        },
        testError.message
      );
    });

    it('should use default context if not provided', () => {
      const testError = new Error('Test error');

      logError(testError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          err: testError,
          context: 'application',
        },
        testError.message
      );
    });
  });

  describe('logWarning', () => {
    it('should log warnings with context and additional info', () => {
      const testMessage = 'Test warning';
      const testContext = 'test-context';
      const additionalInfo = { userId: 123 };

      logWarning(testMessage, testContext, additionalInfo);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        {
          context: testContext,
          userId: 123,
        },
        testMessage
      );
    });
  });

  describe('logInfo', () => {
    it('should log info with context and additional info', () => {
      const testMessage = 'Test info';
      const testContext = 'test-context';
      const additionalInfo = { userId: 123 };

      logInfo(testMessage, testContext, additionalInfo);

      expect(mockLogger.info).toHaveBeenCalledWith(
        {
          context: testContext,
          userId: 123,
        },
        testMessage
      );
    });
  });

  describe('logDebug', () => {
    it('should log debug messages with context and additional info', () => {
      const testMessage = 'Test debug';
      const testContext = 'test-context';
      const additionalInfo = { userId: 123 };

      logDebug(testMessage, testContext, additionalInfo);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        {
          context: testContext,
          userId: 123,
        },
        testMessage
      );
    });
  });

  describe('logPerformance', () => {
    it('should log performance metrics', () => {
      const operation = 'test-operation';
      const durationMs = 100;
      const additionalInfo = { userId: 123 };

      logPerformance(operation, durationMs, additionalInfo);

      expect(mockLogger.info).toHaveBeenCalledWith(
        {
          context: 'performance',
          operation,
          durationMs,
          userId: 123,
        },
        `${operation} completed in ${durationMs}ms`
      );
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security events with user ID', () => {
      const event = 'login-attempt';
      const userId = 123;
      const additionalInfo = { ip: '127.0.0.1' };

      logSecurityEvent(event, userId, additionalInfo);

      expect(mockLogger.info).toHaveBeenCalledWith(
        {
          context: 'security',
          event,
          userId,
          ip: '127.0.0.1',
        },
        `Security event: ${event}`
      );
    });

    it('should handle null user ID for unauthenticated events', () => {
      const event = 'failed-login';
      const userId = null;

      logSecurityEvent(event, userId);

      expect(mockLogger.info).toHaveBeenCalledWith(
        {
          context: 'security',
          event,
          userId: null,
        },
        `Security event: ${event}`
      );
    });
  });

  describe('Sensitive Data Redaction', () => {
    it('should redact sensitive information', () => {
      const sensitiveData = {
        username: 'testuser',
        password: 'secret123',
        token: 'jwt-token',
        nested: {
          password: 'nested-secret',
          token: 'nested-token',
        },
      };

      logInfo('Test message', 'security', sensitiveData);

      // Verify the sensitive data was not logged
      const loggedData = mockLogger.info.mock.calls[0][0] as Record<string, any>;
      expect(loggedData).not.toHaveProperty('password');
      expect(loggedData).not.toHaveProperty('token');
      expect(loggedData.nested).not.toHaveProperty('password');
      expect(loggedData.nested).not.toHaveProperty('token');
      expect(loggedData).toHaveProperty('username', 'testuser');
    });
  });
});
