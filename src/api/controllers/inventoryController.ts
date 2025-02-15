import { Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors';
import { createLogger } from '../../utils/logger';
import InventoryItem, {
  createInventoryItem,
  getInventoryItemById,
  updateInventoryItem,
  updateStock,
  listInventoryItems,
  getInventoryStats,
  ItemCategory,
  StockMovementType,
  SearchParams
} from '../../models/InventoryItem';
import { AuthenticatedRequest } from '../../types/request';

const logger = createLogger('inventory');

export class InventoryController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        location,
        isActive,
        lowStock,
        search,
        sortBy,
        sortOrder
      } = req.query;

      const params: SearchParams = {
        category: category as ItemCategory,
        location: location as string,
        isActive: isActive === 'true',
        lowStock: lowStock === 'true',
        search: search as string,
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await listInventoryItems(params);

      res.json({
        success: true,
        data: {
          items: result.items,
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
      const item = await getInventoryItemById(Number(id));

      if (!item) {
        throw new AppError(404, 'NOT_FOUND', 'Inventory item not found');
      }

      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        name,
        description,
        category,
        sku,
        quantity,
        minQuantity,
        unitPrice,
        location,
        supplier,
        notes
      } = req.body;

      if (!req.user?.id) {
        throw new AppError(401, 'UNAUTHORIZED', 'User must be authenticated');
      }

      // Validate input using Zod schema
      InventoryItem.validate.parse({
        name,
        description,
        category,
        sku,
        quantity,
        minQuantity,
        unitPrice,
        location,
        supplier,
        notes,
        isActive: true,
        createdById: req.user.id,
        updatedById: req.user.id
      });

      const newItem = await createInventoryItem({
        name,
        description,
        category,
        sku,
        quantity,
        minQuantity,
        unitPrice,
        location,
        supplier,
        notes,
        isActive: true,
        createdById: req.user.id,
        updatedById: req.user.id
      });

      logger.info({ itemId: newItem.id }, 'Inventory item created successfully');

      res.status(201).json({
        success: true,
        data: newItem
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        category,
        sku,
        minQuantity,
        unitPrice,
        location,
        supplier,
        notes,
        isActive
      } = req.body;

      if (!req.user?.id) {
        throw new AppError(401, 'UNAUTHORIZED', 'User must be authenticated');
      }

      const existingItem = await getInventoryItemById(Number(id));
      if (!existingItem) {
        throw new AppError(404, 'NOT_FOUND', 'Inventory item not found');
      }

      const updatedItem = await updateInventoryItem(Number(id), {
        name,
        description,
        category,
        sku,
        minQuantity,
        unitPrice,
        location,
        supplier,
        notes,
        isActive,
        updatedById: req.user.id
      });

      logger.info({ itemId: id }, 'Inventory item updated successfully');

      res.json({
        success: true,
        data: updatedItem
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { quantity, type, eventId, notes } = req.body;

      if (!req.user?.id) {
        throw new AppError(401, 'UNAUTHORIZED', 'User must be authenticated');
      }

      const existingItem = await getInventoryItemById(Number(id));
      if (!existingItem) {
        throw new AppError(404, 'NOT_FOUND', 'Inventory item not found');
      }

      const result = await updateStock(
        Number(id),
        Number(quantity),
        type as StockMovementType,
        req.user.id,
        eventId,
        notes
      );

      logger.info(
        { itemId: id, quantity, type },
        'Inventory stock updated successfully'
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await getInventoryStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}
