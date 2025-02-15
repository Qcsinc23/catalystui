import { Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors';
import { eventLogger as logger } from '../../utils/logger';
import Event, {
  EventStatus,
  RiskLevel,
  createEvent,
  getEventById,
  getEventWithMetrics,
  updateEvent,
  cancelEvent,
  listEvents,
  addEventInspection,
  getEventMetrics
} from '../../models/Event';
import { AuthenticatedRequest } from '../../types/request';

export class EventController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        type, 
        riskLevel,
        startDate,
        endDate 
      } = req.query;

      const result = await listEvents({
        status: status ? (status as string).toLowerCase() as EventStatus : undefined,
        riskLevel: riskLevel ? (riskLevel as string).toLowerCase() as RiskLevel : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit)
      });

      res.json({
        success: true,
        data: {
          events: result.events,
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

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const event = await getEventWithMetrics(Number(id));

      if (!event) {
        throw new AppError(404, 'NOT_FOUND', 'Event not found');
      }

      res.json({
        success: true,
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        title,
        description,
        startDate,
        endDate,
        location,
        type,
        qualityRequirements,
        riskLevel,
        requiredInspections
      } = req.body;

      // Validate dates
      if (new Date(startDate) >= new Date(endDate)) {
        throw new AppError(400, 'INVALID_DATES', 'End date must be after start date');
      }

      if (!req.user?.id) {
        throw new AppError(401, 'UNAUTHORIZED', 'User must be authenticated');
      }

      // Validate input using Zod schema
      Event.validate.parse({
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        type,
        status: 'draft',
        qualityRequirements,
        riskLevel,
        requiredInspections,
        createdById: req.user.id
      });

      const newEvent = await createEvent({
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        type,
        status: 'draft',
        qualityRequirements,
        riskLevel,
        requiredInspections,
        createdById: req.user.id
      });

      logger.info({ eventId: newEvent.id }, 'Event created successfully');

      res.status(201).json({
        success: true,
        data: newEvent
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        startDate,
        endDate,
        location,
        type,
        status,
        qualityRequirements,
        riskLevel,
        requiredInspections
      } = req.body;

      // Check if event exists
      const existingEvent = await getEventById(Number(id));
      if (!existingEvent) {
        throw new AppError(404, 'NOT_FOUND', 'Event not found');
      }

      // Only allow updates if event is not completed or cancelled
      if (['completed', 'cancelled'].includes(existingEvent.status)) {
        throw new AppError(400, 'INVALID_STATUS', 'Cannot update completed or cancelled events');
      }

      // Validate dates if both are provided
      if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        throw new AppError(400, 'INVALID_DATES', 'End date must be after start date');
      }

      const updatedEvent = await updateEvent(Number(id), {
        title,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        location,
        type,
        status,
        qualityRequirements,
        riskLevel,
        requiredInspections
      });

      logger.info({ eventId: id }, 'Event updated successfully');

      res.json({
        success: true,
        data: updatedEvent
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Check if event exists
      const existingEvent = await getEventById(Number(id));
      if (!existingEvent) {
        throw new AppError(404, 'NOT_FOUND', 'Event not found');
      }

      // Cancel the event instead of deleting
      const success = await cancelEvent(Number(id));
      if (!success) {
        throw new AppError(500, 'UPDATE_FAILED', 'Failed to cancel event');
      }

      logger.info({ eventId: id }, 'Event cancelled successfully');

      res.json({
        success: true,
        message: 'Event cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async addInspection(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { type, description, assignedTo, dueDate } = req.body;

      // Check if event exists
      const existingEvent = await getEventById(Number(id));
      if (!existingEvent) {
        throw new AppError(404, 'NOT_FOUND', 'Event not found');
      }

      if (!req.user?.id) {
        throw new AppError(401, 'UNAUTHORIZED', 'User must be authenticated');
      }

      const inspection = await addEventInspection({
        eventId: Number(id),
        type,
        description,
        assignedTo,
        dueDate: new Date(dueDate),
        createdById: req.user.id
      });

      logger.info({ eventId: id, inspectionId: inspection.id }, 'Inspection added to event');

      res.status(201).json({
        success: true,
        data: inspection
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEventMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;

      const metrics = await getEventMetrics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }
}
