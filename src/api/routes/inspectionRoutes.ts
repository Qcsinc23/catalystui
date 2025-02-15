import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod';
import { InspectionController } from '../controllers/inspectionController';
import { authorize } from '../middleware/authMiddleware';
import { zodValidateRequest } from '../middleware/zodValidateRequest';
import { AuthenticatedRequest } from '../../types/request';

const router = Router();

// Validation Schemas

const createInspectionSchema = z.object({
  body: z.object({
    eventId: z.number(),
    type: z.string(),
    description: z.string(),
    assignedTo: z.number(),
    dueDate: z.string().transform((str) => new Date(str)),
    requirements: z.array(z.string()).optional(),
  }),
});

const updateInspectionSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  query: z.object({
    eventId: z.string(), // Consider using z.coerce.number() if a number is expected
  }),
  body: z.object({
    type: z.string().optional(),
    description: z.string().optional(),
    assignedTo: z.number().optional(),
    dueDate: z.string().transform((str) => new Date(str)).optional(),
    requirements: z.array(z.string()).optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'failed']).optional(),
    findings: z.string().optional(),
  }),
});

const updateStatusSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  query: z.object({
    eventId: z.string(), // Consider using z.coerce.number() if a number is expected
  }),
  body: z.object({
    status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
  }),
});

// Helper to wrap async route handlers

const asyncHandler = (
  fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
  };
};

// Bound controller methods with explicit return types

const boundController = {
  list: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    return InspectionController.list(req, res, next);
  },
  getById: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    return InspectionController.getById(req, res, next);
  },
  create: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    return InspectionController.create(req, res, next);
  },
  update: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    return InspectionController.update(req, res, next);
  },
  updateStatus: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    return InspectionController.updateStatus(req, res, next);
  },
};

// Routes

router.get(
  '/',
  authorize('user', 'admin', 'manager', 'inspector'),
  asyncHandler(boundController.list)
);

router.get(
  '/:id',
  authorize('user', 'admin', 'manager', 'inspector'),
  asyncHandler(boundController.getById)
);

router.post(
  '/',
  authorize('admin', 'manager'),
  zodValidateRequest(createInspectionSchema),
  asyncHandler(boundController.create)
);

router.put(
  '/:id',
  authorize('admin', 'manager', 'inspector'),
  zodValidateRequest(updateInspectionSchema),
  asyncHandler(boundController.update)
);

router.patch(
  '/:id/status',
  authorize('admin', 'manager', 'inspector'),
  zodValidateRequest(updateStatusSchema),
  asyncHandler(boundController.updateStatus)
);

export default router;
