import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../../utils/errors';
import { ValidationErrors } from '../../utils/types';

export const zodValidateRequest = (schema: AnyZodObject): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationErrors = {};
        
        error.errors.forEach((err) => {
          // Remove the first part of the path (body, query, params)
          const field = err.path.slice(1).join('.');
          if (!validationErrors[field]) {
            validationErrors[field] = [];
          }
          validationErrors[field].push(err.message);
        });

        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid request parameters',
          validationErrors
        );
      }
      next(error);
    }
  };
};
