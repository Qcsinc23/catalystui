import { Router } from 'express';
import { body } from 'express-validator';
import { ReportController } from '../controllers/reportController';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { ReportType, ReportPeriod } from '../../models/Report';

const router = Router();

// Validation schemas
const generateReportValidation = [
  body('type')
    .isIn(Object.values(ReportType))
    .withMessage('Invalid report type'),
  body('period')
    .isIn(Object.values(ReportPeriod))
    .withMessage('Invalid report period'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((endDate, { req }) => {
      if (req.body.period === ReportPeriod.CUSTOM) {
        if (!req.body.startDate || !endDate) {
          throw new Error('Custom period requires both start and end dates');
        }
        if (new Date(endDate) <= new Date(req.body.startDate)) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    })
];

// Routes
router.get('/available',
  authenticate,
  authorize('admin', 'manager'),
  ReportController.getAvailableReports
);

router.post('/generate',
  authenticate,
  authorize('admin', 'manager'),
  generateReportValidation,
  validateRequest,
  ReportController.generateReport
);

export default router;
