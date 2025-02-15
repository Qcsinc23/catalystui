import { Router } from 'express';
import { CommentController } from '../controllers/commentController';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/authMiddleware';
import { body, param } from 'express-validator';

const router = Router({ mergeParams: true }); // mergeParams to access entityType and entityId from parent router

// Validation schemas
const createCommentValidation = [
  param('entityType')
    .isIn(['event', 'inspection'])
    .withMessage('Invalid entity type'),
  param('entityId')
    .isInt()
    .withMessage('Entity ID must be an integer'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 2000 })
    .withMessage('Comment must be at most 2000 characters'),
  body('parentId')
    .optional()
    .isInt()
    .withMessage('Parent comment ID must be an integer'),
];

const updateCommentValidation = [
  param('id')
    .isInt()
    .withMessage('Comment ID must be an integer'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 2000 })
    .withMessage('Comment must be at most 2000 characters'),
];

const deleteCommentValidation = [
  param('id')
    .isInt()
    .withMessage('Comment ID must be an integer'),
];

// Query parameter validation
const listQueryValidation = [
  param('entityType')
    .isIn(['event', 'inspection'])
    .withMessage('Invalid entity type'),
  param('entityId')
    .isInt()
    .withMessage('Entity ID must be an integer'),
  body('parentId')
    .optional()
    .isInt()
    .withMessage('Parent ID must be an integer'),
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const getRepliesValidation = [
  param('id')
    .isInt()
    .withMessage('Comment ID must be an integer'),
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Routes
router.get('/', authenticate, listQueryValidation, validateRequest, CommentController.list);
router.post('/', authenticate, createCommentValidation, validateRequest, CommentController.create);
router.put('/:id', authenticate, updateCommentValidation, validateRequest, CommentController.update);
router.delete('/:id', authenticate, deleteCommentValidation, validateRequest, CommentController.delete);
router.get('/:id/replies', authenticate, getRepliesValidation, validateRequest, CommentController.getReplies);

export default router;
