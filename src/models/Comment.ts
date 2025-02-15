import { z } from 'zod';
import { executeQuery } from '../utils/database';

// Define the entity type
export type EntityType = 'event' | 'inspection';

// Define the Comment attributes interface
export interface CommentAttributes {
  id?: number;
  entityType: EntityType;
  entityId: number;
  content: string;
  parentId?: number | null;
  createdById: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the Comment model
class Comment {
  public id?: number;
  public entityType: EntityType;
  public entityId: number;
  public content: string;
  public parentId?: number | null;
  public createdById: number;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(attributes: CommentAttributes) {
    this.id = attributes.id;
    this.entityType = attributes.entityType;
    this.entityId = attributes.entityId;
    this.content = attributes.content;
    this.parentId = attributes.parentId;
    this.createdById = attributes.createdById;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  static create(attributes: CommentAttributes): Comment {
    return new Comment(attributes);
  }

  // Add a static method for input validation using Zod
  static validate = z.object({
    entityType: z.enum(['event', 'inspection']),
    entityId: z.number().positive(),
    content: z.string().min(1).max(10000),
    parentId: z.number().positive().nullable().optional(),
    createdById: z.number().positive()
  });
}

// Database Operations

export async function createComment(comment: CommentAttributes): Promise<Comment> {
  const result = await executeQuery<CommentAttributes>(
    `INSERT INTO Comments (
      EntityType, EntityId, Content, ParentId, CreatedById,
      CreatedAt, UpdatedAt
    )
    OUTPUT INSERTED.*
    VALUES (
      @entityType, @entityId, @content, @parentId, @createdById,
      GETUTCDATE(), GETUTCDATE()
    )`,
    {
      entityType: comment.entityType,
      entityId: comment.entityId,
      content: comment.content,
      parentId: comment.parentId,
      createdById: comment.createdById
    }
  );
  return Comment.create(result[0]);
}

export async function getCommentById(id: number): Promise<Comment | undefined> {
  const result = await executeQuery<CommentAttributes>(
    'SELECT * FROM Comments WHERE Id = @id',
    { id }
  );
  return result[0] ? Comment.create(result[0]) : undefined;
}

export async function updateComment(id: number, content: string): Promise<Comment | undefined> {
  const result = await executeQuery<CommentAttributes>(
    `UPDATE Comments
     SET Content = @content, UpdatedAt = GETUTCDATE()
     OUTPUT INSERTED.*
     WHERE Id = @id`,
    { id, content }
  );
  return result[0] ? Comment.create(result[0]) : undefined;
}

export async function deleteComment(id: number): Promise<boolean> {
  try {
    const result = await executeQuery<{ rowsAffected?: number[] }>(
      'DELETE FROM Comments WHERE Id = @id',
      { id }
    );
    return (result?.rowsAffected?.[0] ?? 0) > 0;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
}

export interface CommentWithUser extends CommentAttributes {
  createdByName: string;
}

export async function listComments(
  options: {
    entityType: EntityType;
    entityId: number;
    parentId?: number | null;
    limit?: number;
    offset?: number;
  }
): Promise<{ comments: CommentWithUser[]; total: number }> {
  const { entityType, entityId, parentId, limit = 10, offset = 0 } = options;
  const params: any = { entityType, entityId, limit, offset };
  let whereClause = 'EntityType = @entityType AND EntityId = @entityId';

  if (parentId === null) {
    whereClause += ' AND ParentId IS NULL';
  } else if (parentId !== undefined) {
    whereClause += ' AND ParentId = @parentId';
    params.parentId = parentId;
  }

  const countResult = await executeQuery<{ total: number }>(
    `SELECT COUNT(*) as total FROM Comments WHERE ${whereClause}`,
    params
  );

  const comments = await executeQuery<CommentWithUser>(
    `SELECT c.*, u.FirstName + ' ' + u.LastName as CreatedByName
     FROM Comments c
     LEFT JOIN Users u ON c.CreatedById = u.Id
     WHERE ${whereClause}
     ORDER BY c.CreatedAt DESC
     OFFSET @offset ROWS
     FETCH NEXT @limit ROWS ONLY`,
    params
  );

  return {
    comments,
    total: countResult[0].total
  };
}

export async function getCommentReplies(
  parentId: number,
  limit = 10,
  offset = 0
): Promise<{ replies: CommentWithUser[]; total: number }> {
  const countResult = await executeQuery<{ total: number }>(
    'SELECT COUNT(*) as total FROM Comments WHERE ParentId = @parentId',
    { parentId }
  );

  const replies = await executeQuery<CommentWithUser>(
    `SELECT c.*, u.FirstName + ' ' + u.LastName as CreatedByName
     FROM Comments c
     LEFT JOIN Users u ON c.CreatedById = u.Id
     WHERE c.ParentId = @parentId
     ORDER BY c.CreatedAt ASC
     OFFSET @offset ROWS
     FETCH NEXT @limit ROWS ONLY`,
    { parentId, limit, offset }
  );

  return {
    replies,
    total: countResult[0].total
  };
}

export default Comment;
