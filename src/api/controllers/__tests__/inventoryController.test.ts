import { Response } from 'express';
import { InventoryController } from '../inventoryController';
import { AppError } from '../../../utils/errors';
import InventoryItem, {
  createInventoryItem,
  getInventoryItemById,
  updateInventoryItem,
  updateStock,
  listInventoryItems,
  getInventoryStats,
  ItemCategory,
  StockMovementType
} from '../../../models/InventoryItem';
import { AuthenticatedRequest } from '../../../types/request';

// Mock the InventoryItem model functions
jest.mock('../../../models/InventoryItem', () => ({
  ...jest.requireActual('../../../models/InventoryItem'),
  createInventoryItem: jest.fn(),
  getInventoryItemById: jest.fn(),
  updateInventoryItem: jest.fn(),
  updateStock: jest.fn(),
  listInventoryItems: jest.fn(),
  getInventoryStats: jest.fn(),
  validate: {
    parse: jest.fn()
  }
}));

describe('InventoryController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: {
        id: 1,
        email: 'test@example.com',
        role: 'admin'
      }
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
  });

  describe('list', () => {
    const mockItems = {
      items: [
        {
          id: 1,
          name: 'Test Item',
          category: ItemCategory.FURNITURE,
          quantity: 10
        }
      ],
      total: 1
    };

    beforeEach(() => {
      (listInventoryItems as jest.Mock).mockResolvedValue(mockItems);
    });

    it('should list inventory items with pagination', async () => {
      mockRequest.query = {
        page: '1',
        limit: '10',
        category: ItemCategory.FURNITURE
      };

      await InventoryController.list(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(listInventoryItems).toHaveBeenCalledWith(
        expect.objectContaining({
          category: ItemCategory.FURNITURE,
          limit: 10,
          offset: 0
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          items: mockItems.items,
          pagination: {
            page: 1,
            limit: 10,
            totalItems: mockItems.total,
            totalPages: 1
          }
        }
      });
    });
  });

  describe('create', () => {
    const mockItem = {
      id: 1,
      name: 'New Item',
      description: 'Test Description',
      category: ItemCategory.FURNITURE,
      sku: 'TEST-001',
      quantity: 10,
      minQuantity: 5,
      unitPrice: 100,
      location: 'Warehouse A'
    };

    beforeEach(() => {
      (InventoryItem.validate.parse as jest.Mock).mockReturnValue(true);
      (createInventoryItem as jest.Mock).mockResolvedValue(mockItem);
    });

    it('should create new inventory item', async () => {
      mockRequest.body = {
        name: mockItem.name,
        description: mockItem.description,
        category: mockItem.category,
        sku: mockItem.sku,
        quantity: mockItem.quantity,
        minQuantity: mockItem.minQuantity,
        unitPrice: mockItem.unitPrice,
        location: mockItem.location
      };

      await InventoryController.create(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(createInventoryItem).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockRequest.body,
          isActive: true,
          createdById: mockRequest.user?.id,
          updatedById: mockRequest.user?.id
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockItem
      });
    });

    it('should throw error if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await InventoryController.create(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.any(AppError)
      );
      const error = nextFunction.mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('User must be authenticated');
    });
  });

  describe('updateStock', () => {
    const mockItem = {
      id: 1,
      quantity: 10
    };

    const mockStockUpdate = {
      item: { ...mockItem, quantity: 15 },
      movement: {
        id: 1,
        type: StockMovementType.PURCHASE,
        quantity: 5
      }
    };

    beforeEach(() => {
      (getInventoryItemById as jest.Mock).mockResolvedValue(mockItem);
      (updateStock as jest.Mock).mockResolvedValue(mockStockUpdate);
    });

    it('should update stock quantity', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        quantity: 5,
        type: StockMovementType.PURCHASE
      };

      await InventoryController.updateStock(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(updateStock).toHaveBeenCalledWith(
        1,
        5,
        StockMovementType.PURCHASE,
        mockRequest.user?.id,
        undefined,
        undefined
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStockUpdate
      });
    });

    it('should throw error for invalid stock movement type', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        quantity: 5,
        type: 'invalid_type'
      };

      await InventoryController.updateStock(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.any(AppError)
      );
      const error = nextFunction.mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid stock movement type');
    });

    it('should throw error if item not found', async () => {
      (getInventoryItemById as jest.Mock).mockResolvedValue(undefined);

      mockRequest.params = { id: '999' };
      mockRequest.body = {
        quantity: 5,
        type: StockMovementType.PURCHASE
      };

      await InventoryController.updateStock(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.any(AppError)
      );
      const error = nextFunction.mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Inventory item not found');
    });
  });

  describe('getStats', () => {
    const mockStats = {
      totalItems: 100,
      totalValue: 10000,
      lowStockItems: 5,
      outOfStockItems: 2
    };

    beforeEach(() => {
      (getInventoryStats as jest.Mock).mockResolvedValue(mockStats);
    });

    it('should return inventory statistics', async () => {
      await InventoryController.getStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(getInventoryStats).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should throw error if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await InventoryController.getStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.any(AppError)
      );
      const error = nextFunction.mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('User must be authenticated');
    });
  });
});
