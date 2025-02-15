export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = this.constructor.name;
    
    // Only use captureStackTrace if it exists (Node.js environment)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error()).stack;
    }

    // Ensure instanceof works in ES5
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, 'AUTHENTICATION_ERROR', message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'You are not authorized to perform this action') {
    super(403, 'AUTHORIZATION_ERROR', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(500, 'DATABASE_ERROR', message, details);
  }
}

export class EventConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(409, 'EVENT_CONFLICT', message, details);
  }
}

export class InventoryError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'INVENTORY_ERROR', message, details);
  }
}

export class FileUploadError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'FILE_UPLOAD_ERROR', message, details);
  }
}

// Error handler type for Express
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Error handler helper functions
export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

export const createErrorResponse = (error: Error): ErrorResponse => {
  if (isAppError(error)) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }

  // Handle unknown errors
  console.error('Unhandled error:', error);
  return {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  };
};

// Validation error helper
export const createValidationError = (errors: Record<string, string[]>) => {
  return new ValidationError('Validation failed', errors);
};

// Not found error helper
export const createNotFoundError = (
  resource: string,
  identifier?: string | number
) => {
  const message = identifier
    ? `${resource} with identifier ${identifier} not found`
    : `${resource} not found`;
  return new NotFoundError(message);
};

// Database error helper
export const createDatabaseError = (error: any) => {
  return new DatabaseError('Database operation failed', {
    message: error.message,
    code: error.code,
  });
};

// Event conflict error helper
export const createEventConflictError = (
  eventId: number,
  conflictingEvents: any[]
) => {
  return new EventConflictError('Event scheduling conflict detected', {
    eventId,
    conflicts: conflictingEvents,
  });
};

// Inventory error helper
export const createInventoryError = (
  itemId: number,
  message: string,
  details?: any
) => {
  return new InventoryError(message, {
    itemId,
    ...details,
  });
};
