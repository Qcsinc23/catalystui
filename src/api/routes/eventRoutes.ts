import { Router } from 'express';
import { EventController } from '../controllers/eventController';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { body, query, param } from 'express-validator';
import { EventStatus, RiskLevel } from '../../models/Event';

const router = Router();

// Validation schemas
const eventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title must be at most 200 characters'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').isISO8601().withMessage('End date must be a valid date'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('type').trim().notEmpty().withMessage('Event type is required'),
  body('qualityRequirements').trim().notEmpty().withMessage('Quality requirements are required'),
  body('riskLevel').isIn(['low', 'medium', 'high'] as RiskLevel[])
    .withMessage('Risk level must be low, medium, or high'),
  body('requiredInspections').trim().notEmpty().withMessage('Required inspections must be specified'),
];

const updateEventValidation = [
  body('title').optional().trim().isLength({ max: 200 })
    .withMessage('Title must be at most 200 characters'),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  body('status').optional().isIn(['draft', 'scheduled', 'in_progress', 'completed', 'cancelled'] as EventStatus[])
    .withMessage('Invalid event status'),
  body('riskLevel').optional().isIn(['low', 'medium', 'high'] as RiskLevel[])
    .withMessage('Risk level must be low, medium, or high'),
];

const inspectionValidation = [
  body('type').trim().notEmpty().withMessage('Inspection type is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('assignedTo').isInt().withMessage('Assigned user ID must be an integer'),
  body('dueDate').isISO8601().withMessage('Due date must be a valid date'),
];

const listQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['draft', 'scheduled', 'in_progress', 'completed', 'cancelled'] as EventStatus[])
    .withMessage('Invalid event status'),
  query('riskLevel').optional().isIn(['low', 'medium', 'high'] as RiskLevel[])
    .withMessage('Invalid risk level'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
];

const metricsQueryValidation = [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
];

// Routes
router.get('/',
  authenticate,
  listQueryValidation,
  validateRequest,
  EventController.list
);

router.get('/metrics',
  authenticate,
  authorize('admin', 'manager'),
  metricsQueryValidation,
  validateRequest,
  EventController.getEventMetrics
);

router.get('/:id',
  authenticate,
  param('id').isInt().withMessage('Event ID must be an integer'),
  validateRequest,
  EventController.getById
);

router.post('/',
  authenticate,
  authorize('admin', 'manager'),
  eventValidation,
  validateRequest,
  EventController.create
);

router.put('/:id',
  authenticate,
  authorize('admin', 'manager'),
  param('id').isInt().withMessage('Event ID must be an integer'),
  updateEventValidation,
  validateRequest,
  EventController.update
);

router.delete('/:id',
  authenticate,
  authorize('admin', 'manager'),
  param('id').isInt().withMessage('Event ID must be an integer'),
  validateRequest,
  EventController.delete
);

router.post('/:id/inspections',
  authenticate,
  authorize('admin', 'manager'),
  param('id').isInt().withMessage('Event ID must be an integer'),
  inspectionValidation,
  validateRequest,
  EventController.addInspection
);

export default router;