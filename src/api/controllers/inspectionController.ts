import { Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors';
import { createLogger } from '../../utils/logger';
import Inspection, {
  createInspection,
  getInspectionById,
  updateInspection,
  updateInspectionStatus,
  listInspections,
  InspectionStatus
} from '../../models/Inspection';
import { AuthenticatedRequest } from '../../types/request';

const logger = createLogger('inspection');

export class InspectionController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status,
        assignedTo,
        eventId
      } = req.query;

      if (!eventId) {
        throw new AppError(400, 'BAD_REQUEST', 'Event ID is required');
      }

      const result = await listInspections(Number(eventId), {
        status: status ? (status as string).toLowerCase() as InspectionStatus : undefined,
        assignedTo: assignedTo ? Number(assignedTo) : undefined,
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit)
      });

      res.json({
        success: true,
        data: {
          inspections: result.inspections,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            totalItems: result.total,
            totalPages: Math.ceil(result.total / Number(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { eventId } = req.query;

      if (!eventId) {
        throw new AppError(400, 'BAD_REQUEST', 'Event ID is required');
      }

      const inspection = await getInspectionById(Number(eventId), Number(id));

      if (!inspection) {
        throw new AppError(404, 'NOT_FOUND', 'Inspection not found');
      }

      res.json({
        success: true,
        data: inspection
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        eventId,
        type,
        description,
        assignedTo,
        dueDate,
        notes
      } = req.body;

      if (!req.user?.id) {
        throw new AppError(401, 'UNAUTHORIZED', 'User must be authenticated');
      }

      // Validate input using Zod schema
      Inspection.validate.parse({
        eventId,
        type,
        description,
        assignedTo,
        dueDate: new Date(dueDate),
        notes,
        status: 'pending' as InspectionStatus,
        createdById: req.user.id
      });

      const newInspection = await createInspection({
        eventId,
        type,
        description,
        assignedTo,
        dueDate: new Date(dueDate),
        notes,
        status: 'pending',
        createdById: req.user.id
      });

      logger.info({ inspectionId: newInspection.id }, 'Inspection created successfully');

      res.status(201).json({
        success: true,
        data: newInspection
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { eventId } = req.query;
      const {
        type,
        description,
        assignedTo,
        dueDate,
        notes,
        status
      } = req.body;

      if (!eventId) {
        throw new AppError(400, 'BAD_REQUEST', 'Event ID is required');
      }

      if (!req.user?.id) {
        throw new AppError(401, 'UNAUTHORIZED', 'User must be authenticated');
      }

      // Check if inspection exists
      const existingInspection = await getInspectionById(Number(eventId), Number(id));
      if (!existingInspection) {
        throw new AppError(404, 'NOT_FOUND', 'Inspection not found');
      }

      // Only assigned inspector or admin can update
      if (existingInspection.assignedTo !== req.user.id && req.user.role !== 'admin') {
        throw new AppError(403, 'FORBIDDEN', 'Not authorized to update this inspection');
      }

      // If status is being updated, validate the transition
      if (status && !Inspection.validateStatusTransition(existingInspection.status, status as InspectionStatus)) {
        throw new AppError(400, 'INVALID_STATUS', 'Invalid status transition');
      }

      const updatedInspection = await updateInspection(Number(eventId), Number(id), {
        type,
        description,
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
        status: status as InspectionStatus
      });

      logger.info({ inspectionId: id }, 'Inspection updated successfully');

      res.json({
        success: true,
        data: updatedInspection
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { eventId } = req.query;
      const { status } = req.body;

      if (!eventId) {
        throw new AppError(400, 'BAD_REQUEST', 'Event ID is required');
      }

      if (!req.user?.id) {
        throw new AppError(401, 'UNAUTHORIZED', 'User must be authenticated');
      }

      // Check if inspection exists
      const existingInspection = await getInspectionById(Number(eventId), Number(id));
      if (!existingInspection) {
        throw new AppError(404, 'NOT_FOUND', 'Inspection not found');
      }

      // Only assigned inspector or admin can update status
      if (existingInspection.assignedTo !== req.user.id && req.user.role !== 'admin') {
        throw new AppError(403, 'FORBIDDEN', 'Not authorized to update this inspection status');
      }

      // Validate status transition
      if (!Inspection.validateStatusTransition(existingInspection.status, status as InspectionStatus)) {
        throw new AppError(400, 'INVALID_STATUS', 'Invalid status transition');
      }

      const updatedInspection = await updateInspectionStatus(
        Number(eventId),
        Number(id),
        status as InspectionStatus
      );

      logger.info({ inspectionId: id, status }, 'Inspection status updated successfully');

      res.json({
        success: true,
        data: updatedInspection
      });
    } catch (error) {
      next(error);
    }
  }
}
