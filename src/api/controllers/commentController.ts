import { Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors';
import { createLogger } from '../../utils/logger';
import Comment, {
  createComment,
  getCommentById,
  updateComment,
  deleteComment,
  listComments,
  getCommentReplies,
  EntityType
} from '../../models/Comment';
import { AuthenticatedRequest } from '../../types/request';

const logger = createLogger('comment');

export class CommentController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityId, entityType, page = 1, limit = 10 } = req.query;

      if (!entityId || !entityType) {
        throw new AppError(400, 'BAD_REQUEST', 'Entity ID and type are required');
      }

      const result = await listComments({
        entityId: Number(entityId),
        entityType: entityType as EntityType,
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit)
      });

      res.json({
        success: true,
        data: {
          comments: result.comments,
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
      const comment = await getCommentById(Number(id));

      if (!comment) {
        throw new AppError(404, 'NOT_FOUND', 'Comment not found');
      }

      res.json({
        success: true,
        data: comment
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityId, entityType, content } = req.body;

      if (!req.user?.id) {
        throw new AppError(401, 'UNAUTHORIZED', 'User must be authenticated');
      }

      // Validate input using Zod schema
      Comment.validate.parse({
        entityId,
        entityType,
        content,
        createdById: req.user.id
      });

      const newComment = await createComment({
        entityId,
        entityType,
        content,
        createdById: req.user.id
      });

      logger.info({ commentId: newComment.id }, 'Comment created successfully');

      res.status(201).json({
        success: true,
        data: newComment
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!req.user?.id) {
        throw new AppError(401, 'UNAUTHORIZED', 'User must be authenticated');
      }

      // Check if comment exists and user has permission to update
      const existingComment = await getCommentById(Number(id));
      if (!existingComment) {
        throw new AppError(404, 'NOT_FOUND', 'Comment not found');
      }

      if (existingComment.createdById !== req.user.id && req.user.role !== 'admin') {
        throw new AppError(403, 'FORBIDDEN', 'Not authorized to update this comment');
      }

      const updatedComment = await updateComment(Number(id), content);

      logger.info({ commentId: id }, 'Comment updated successfully');

      res.json({
        success: true,
        data: updatedComment
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!req.user?.id) {
        throw new AppError(401, 'UNAUTHORIZED', 'User must be authenticated');
      }

      // Check if comment exists and user has permission to delete
      const existingComment = await getCommentById(Number(id));
      if (!existingComment) {
        throw new AppError(404, 'NOT_FOUND', 'Comment not found');
      }

      if (existingComment.createdById !== req.user.id && req.user.role !== 'admin') {
        throw new AppError(403, 'FORBIDDEN', 'Not authorized to delete this comment');
      }

      await deleteComment(Number(id));

      logger.info({ commentId: id }, 'Comment deleted successfully');

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReplies(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const result = await getCommentReplies(
        Number(id),
        Number(limit),
        (Number(page) - 1) * Number(limit)
      );

      res.json({
        success: true,
        data: {
          comments: result.replies,
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
}
