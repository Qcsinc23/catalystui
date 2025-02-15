import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../../utils/errors';
import { ValidationErrors } from '../../utils/types';

type FieldValidationError = {
  param: string;
  msg: string;
  location: string;
  value: any;
};

export const validateRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors: ValidationErrors = {};
    
    errors.array().forEach((error) => {
      if ('param' in error) {
        const fieldError = error as FieldValidationError;
        const field = fieldError.param;
        if (!validationErrors[field]) {
          validationErrors[field] = [];
        }
        validationErrors[field].push(fieldError.msg);
      }
    });

    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Invalid request parameters',
      validationErrors
    );
  }

  next();
};

// Helper function to validate ObjectId
export const isValidObjectId = (value: string) => {
  return /^[0-9a-fA-F]{24}$/.test(value);
};

// Common validation messages
export const ValidationMessages = {
  required: (field: string) => `${field} is required`,
  invalid: (field: string) => `Invalid ${field}`,
  minLength: (field: string, length: number) => 
    `${field} must be at least ${length} characters long`,
  maxLength: (field: string, length: number) => 
    `${field} must not exceed ${length} characters`,
  email: 'Must be a valid email address',
  password: {
    length: 'Password must be at least 8 characters long',
    uppercase: 'Password must contain at least one uppercase letter',
    lowercase: 'Password must contain at least one lowercase letter',
    number: 'Password must contain at least one number',
    special: 'Password must contain at least one special character',
  },
  objectId: (field: string) => `Invalid ${field} ID format`,
  date: (field: string) => `Invalid ${field} date format`,
  future: (field: string) => `${field} must be in the future`,
  positive: (field: string) => `${field} must be a positive number`,
  enum: (field: string, values: string[]) => 
    `${field} must be one of: ${values.join(', ')}`,
  unique: (field: string) => `${field} already exists`,
  match: (field1: string, field2: string) => 
    `${field1} and ${field2} must match`,
  fileSize: (maxSize: number) => 
    `File size must not exceed ${maxSize / (1024 * 1024)}MB`,
  fileType: (types: string[]) => 
    `File type must be one of: ${types.join(', ')}`,
};

// Common validation chains
export const commonValidations = {
  objectId: (field: string) => ({
    in: ['params', 'body'],
    errorMessage: ValidationMessages.objectId(field),
    custom: {
      options: isValidObjectId,
    },
  }),
  email: {
    isEmail: true,
    normalizeEmail: true,
    errorMessage: ValidationMessages.email,
  },
  password: {
    isLength: {
      options: { min: 8 },
      errorMessage: ValidationMessages.password.length,
    },
    matches: [
      {
        options: /[A-Z]/,
        errorMessage: ValidationMessages.password.uppercase,
      },
      {
        options: /[a-z]/,
        errorMessage: ValidationMessages.password.lowercase,
      },
      {
        options: /[0-9]/,
        errorMessage: ValidationMessages.password.number,
      },
      {
        options: /[!@#$%^&*]/,
        errorMessage: ValidationMessages.password.special,
      },
    ],
  },
};