import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  EventConflictError,
  InventoryError,
  FileUploadError,
  isAppError,
  createErrorResponse,
  createValidationError,
  createNotFoundError,
  createDatabaseError,
  createEventConflictError,
  createInventoryError,
} from '../errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create base error with correct properties', () => {
      const error = new AppError(500, 'TEST_ERROR', 'Test message', { detail: 'test' });
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.stack).toBeDefined();
      expect(error.name).toBe('AppError');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with correct properties', () => {
      const details = { field: ['Invalid value'] };
      const error = new ValidationError('Validation failed', details);
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Validation failed');
      expect(error.details).toEqual(details);
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error with default message', () => {
      const error = new AuthenticationError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.message).toBe('Authentication failed');
    });

    it('should create authentication error with custom message', () => {
      const error = new AuthenticationError('Invalid token');
      
      expect(error.message).toBe('Invalid token');
    });
  });

  describe('AuthorizationError', () => {
    it('should create authorization error with default message', () => {
      const error = new AuthorizationError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.message).toBe('You are not authorized to perform this action');
    });

    it('should create authorization error with custom message', () => {
      const error = new AuthorizationError('Insufficient permissions');
      
      expect(error.message).toBe('Insufficient permissions');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with resource name', () => {
      const error = new NotFoundError('User');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('User not found');
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error with message', () => {
      const error = new ConflictError('Resource already exists');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
      expect(error.message).toBe('Resource already exists');
    });
  });

  describe('DatabaseError', () => {
    it('should create database error with default message', () => {
      const error = new DatabaseError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.message).toBe('Database operation failed');
    });

    it('should create database error with custom message and details', () => {
      const details = { query: 'SELECT *', error: 'Connection failed' };
      const error = new DatabaseError('Query failed', details);
      
      expect(error.message).toBe('Query failed');
      expect(error.details).toEqual(details);
    });
  });

  describe('EventConflictError', () => {
    it('should create event conflict error with message and details', () => {
      const details = { eventId: 1, conflictingEvent: 2 };
      const error = new EventConflictError('Event time conflict', details);
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('EVENT_CONFLICT');
      expect(error.message).toBe('Event time conflict');
      expect(error.details).toEqual(details);
    });
  });

  describe('InventoryError', () => {
    it('should create inventory error with message and details', () => {
      const details = { itemId: 1, quantity: 0 };
      const error = new InventoryError('Insufficient stock', details);
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('INVENTORY_ERROR');
      expect(error.message).toBe('Insufficient stock');
      expect(error.details).toEqual(details);
    });
  });

  describe('FileUploadError', () => {
    it('should create file upload error with message and details', () => {
      const details = { filename: 'test.jpg', size: '5MB' };
      const error = new FileUploadError('File too large', details);
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('FILE_UPLOAD_ERROR');
      expect(error.message).toBe('File too large');
      expect(error.details).toEqual(details);
    });
  });
});

describe('Error Helper Functions', () => {
  describe('isAppError', () => {
    it('should return true for AppError instances', () => {
      const error = new AppError(500, 'TEST', 'test');
      expect(isAppError(error)).toBe(true);
    });

    it('should return false for non-AppError instances', () => {
      const error = new Error('test');
      expect(isAppError(error)).toBe(false);
    });
  });

  describe('createErrorResponse', () => {
    it('should create response for AppError', () => {
      const error = new AppError(500, 'TEST', 'test message', { detail: 'test' });
      const response = createErrorResponse(error);
      
      expect(response).toEqual({
        success: false,
        error: {
          code: 'TEST',
          message: 'test message',
          details: { detail: 'test' },
        },
      });
    });

    it('should create response for unknown error', () => {
      const error = new Error('Unknown error');
      const response = createErrorResponse(error);
      
      expect(response).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    });
  });

  describe('createValidationError', () => {
    it('should create validation error with errors object', () => {
      const errors = { email: ['Invalid email'], password: ['Too short'] };
      const error = createValidationError(errors);
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.details).toEqual(errors);
    });
  });

  describe('createNotFoundError', () => {
    it('should create not found error with resource name', () => {
      const error = createNotFoundError('User');
      
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('User not found');
    });

    it('should create not found error with resource name and identifier', () => {
      const error = createNotFoundError('User', 123);
      
      expect(error.message).toBe('User with identifier 123 not found');
    });
  });

  describe('createDatabaseError', () => {
    it('should create database error with error object', () => {
      const dbError = { message: 'Connection failed', code: 'ECONNREFUSED' };
      const error = createDatabaseError(dbError);
      
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.details).toEqual({
        message: 'Connection failed',
        code: 'ECONNREFUSED',
      });
    });
  });

  describe('createEventConflictError', () => {
    it('should create event conflict error with event details', () => {
      const eventId = 1;
      const conflicts = [{ id: 2, time: '2024-02-09T14:00:00Z' }];
      const error = createEventConflictError(eventId, conflicts);
      
      expect(error).toBeInstanceOf(EventConflictError);
      expect(error.details).toEqual({
        eventId,
        conflicts,
      });
    });
  });

  describe('createInventoryError', () => {
    it('should create inventory error with item details', () => {
      const itemId = 1;
      const message = 'Insufficient stock';
      const details = { currentStock: 0, requested: 5 };
      const error = createInventoryError(itemId, message, details);
      
      expect(error).toBeInstanceOf(InventoryError);
      expect(error.message).toBe(message);
      expect(error.details).toEqual({
        itemId,
        currentStock: 0,
        requested: 5,
      });
    });
  });
});
