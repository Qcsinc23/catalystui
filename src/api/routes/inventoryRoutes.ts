import { Router, Response, NextFunction } from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { body, query, param } from 'express-validator';
import { ItemCategory, StockMovementType } from '../../models/InventoryItem';
import { AuthenticatedRequest } from '../../types/request';

const router = Router();

// Validation schemas
const createInventoryValidation = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 200 }).withMessage('Name must be at most 200 characters'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(Object.values(ItemCategory)).withMessage('Invalid category'),
  body('sku').trim().notEmpty().withMessage('SKU is required')
    .isLength({ max: 50 }).withMessage('SKU must be at most 50 characters'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('minQuantity').isInt({ min: 0 }).withMessage('Minimum quantity must be a non-negative integer'),
  body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  body('location').trim().notEmpty().withMessage('Location is required')
    .isLength({ max: 200 }).withMessage('Location must be at most 200 characters'),
  body('supplier').optional().trim(),
  body('notes').optional().trim()
];

const updateInventoryValidation = [
  body('name').optional().trim()
    .isLength({ max: 200 }).withMessage('Name must be at most 200 characters'),
  body('description').optional().trim(),
  body('category').optional().isIn(Object.values(ItemCategory)).withMessage('Invalid category'),
  body('sku').optional().trim()
    .isLength({ max: 50 }).withMessage('SKU must be at most 50 characters'),
  body('minQuantity').optional().isInt({ min: 0 }).withMessage('Minimum quantity must be a non-negative integer'),
  body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  body('location').optional().trim()
    .isLength({ max: 200 }).withMessage('Location must be at most 200 characters'),
  body('supplier').optional().trim(),
  body('notes').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

const updateStockValidation = [
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('type').isIn(Object.values(StockMovementType)).withMessage('Invalid stock movement type'),
  body('eventId').optional().isInt().withMessage('Event ID must be an integer'),
  body('notes').optional().trim()
];

const listQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(Object.values(ItemCategory)).withMessage('Invalid category'),
  query('location').optional().trim(),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('lowStock').optional().isBoolean().withMessage('lowStock must be a boolean'),
  query('search').optional().trim(),
  query('sortBy').optional().isIn(['name', 'category', 'quantity', 'location', 'updatedAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order')
];

// Custom middleware to check if user can manage inventory
const canManageInventory = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'User must be authenticated'
      }
    });
  }

  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to manage inventory'
      }
    });
  }

  next();
};

// Routes
router.get('/',
  authenticate,
  listQueryValidation,
  validateRequest,
  InventoryController.list
);

router.get('/stats',
  authenticate,
  authorize('admin', 'manager'),
  InventoryController.getStats
);

router.get('/:id',
  authenticate,
  param('id').isInt().withMessage('Inventory ID must be an integer'),
  validateRequest,
  InventoryController.getById
);

router.post('/',
  authenticate,
  canManageInventory,
  createInventoryValidation,
  validateRequest,
  InventoryController.create
);

router.put('/:id',
  authenticate,
  canManageInventory,
  param('id').isInt().withMessage('Inventory ID must be an integer'),
  updateInventoryValidation,
  validateRequest,
  InventoryController.update
);

router.patch('/:id/stock',
  authenticate,
  canManageInventory,
  param('id').isInt().withMessage('Inventory ID must be an integer'),
  updateStockValidation,
  validateRequest,
  InventoryController.updateStock
);

export default router;
