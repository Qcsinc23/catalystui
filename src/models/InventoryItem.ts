import { z } from 'zod';
import { executeQuery } from '../utils/database';

// Define the item category type
export enum ItemCategory {
  FURNITURE = 'furniture',
  ELECTRONICS = 'electronics',
  DECOR = 'decor',
  LIGHTING = 'lighting',
  AUDIO = 'audio',
  VIDEO = 'video',
  LINENS = 'linens',
  TABLEWARE = 'tableware',
  OTHER = 'other'
}

export enum StockMovementType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  EVENT_ALLOCATION = 'event_allocation',
  EVENT_RETURN = 'event_return',
  ADJUSTMENT = 'adjustment',
  DAMAGE = 'damage'
}

// Define the InventoryItem attributes interface
export interface InventoryItemAttributes {
  id?: number;
  name: string;
  description: string;
  category: ItemCategory;
  sku: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  location: string;
  supplier?: string;
  notes?: string;
  isActive: boolean;
  createdById: number;
  updatedById: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the InventoryItem model
class InventoryItem {
  public id?: number;
  public name: string;
  public description: string;
  public category: ItemCategory;
  public sku: string;
  public quantity: number;
  public minQuantity: number;
  public unitPrice: number;
  public location: string;
  public supplier?: string;
  public notes?: string;
  public isActive: boolean;
  public createdById: number;
  public updatedById: number;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(attributes: InventoryItemAttributes) {
    this.id = attributes.id;
    this.name = attributes.name;
    this.description = attributes.description;
    this.category = attributes.category;
    this.sku = attributes.sku;
    this.quantity = attributes.quantity;
    this.minQuantity = attributes.minQuantity;
    this.unitPrice = attributes.unitPrice;
    this.location = attributes.location;
    this.supplier = attributes.supplier;
    this.notes = attributes.notes;
    this.isActive = attributes.isActive;
    this.createdById = attributes.createdById;
    this.updatedById = attributes.updatedById;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  static create(attributes: InventoryItemAttributes): InventoryItem {
    return new InventoryItem(attributes);
  }

  // Add a static method for input validation using Zod
  static validate = z.object({
    name: z.string().min(1).max(200),
    description: z.string(),
    category: z.nativeEnum(ItemCategory),
    sku: z.string().min(1).max(50),
    quantity: z.number().min(0),
    minQuantity: z.number().min(0),
    unitPrice: z.number().min(0),
    location: z.string().min(1).max(200),
    supplier: z.string().optional(),
    notes: z.string().optional(),
    isActive: z.boolean(),
    createdById: z.number().positive(),
    updatedById: z.number().positive()
  });
}

// Database Operations

export async function createInventoryItem(item: InventoryItemAttributes): Promise<InventoryItem> {
  const result = await executeQuery<InventoryItemAttributes>(
    `INSERT INTO InventoryItems (
      Name, Description, Category, SKU, Quantity,
      MinQuantity, UnitPrice, Location, Supplier,
      Notes, IsActive, CreatedById, UpdatedById,
      CreatedAt, UpdatedAt
    )
    OUTPUT INSERTED.*
    VALUES (
      @name, @description, @category, @sku, @quantity,
      @minQuantity, @unitPrice, @location, @supplier,
      @notes, @isActive, @createdById, @updatedById,
      GETUTCDATE(), GETUTCDATE()
    )`,
    {
      name: item.name,
      description: item.description,
      category: item.category,
      sku: item.sku,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      unitPrice: item.unitPrice,
      location: item.location,
      supplier: item.supplier,
      notes: item.notes,
      isActive: item.isActive,
      createdById: item.createdById,
      updatedById: item.updatedById
    }
  );
  return InventoryItem.create(result[0]);
}

export async function getInventoryItemById(id: number): Promise<InventoryItem | undefined> {
  const result = await executeQuery<InventoryItemAttributes>(
    'SELECT * FROM InventoryItems WHERE Id = @id',
    { id }
  );
  return result[0] ? InventoryItem.create(result[0]) : undefined;
}

export interface InventoryItemWithUser extends InventoryItemAttributes {
  createdByName: string;
  updatedByName: string;
}

export async function getInventoryItemWithDetails(id: number): Promise<InventoryItemWithUser | undefined> {
  const result = await executeQuery<InventoryItemWithUser>(
    `SELECT i.*,
      CONCAT(u1.FirstName, ' ', u1.LastName) as CreatedByName,
      CONCAT(u2.FirstName, ' ', u2.LastName) as UpdatedByName
    FROM InventoryItems i
    LEFT JOIN Users u1 ON i.CreatedById = u1.Id
    LEFT JOIN Users u2 ON i.UpdatedById = u2.Id
    WHERE i.Id = @id`,
    { id }
  );
  return result[0];
}

export async function updateInventoryItem(
  id: number,
  updates: Partial<InventoryItemAttributes>
): Promise<InventoryItem | undefined> {
  const updateFields = Object.entries(updates)
    .map(([key, _]) => `${key} = @${key}`)
    .join(', ');

  const result = await executeQuery<InventoryItemAttributes>(
    `UPDATE InventoryItems
     SET ${updateFields}, UpdatedAt = GETUTCDATE()
     OUTPUT INSERTED.*
     WHERE Id = @id`,
    { ...updates, id }
  );
  return result[0] ? InventoryItem.create(result[0]) : undefined;
}

export interface StockMovement {
  id: number;
  inventoryItemId: number;
  type: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  notes?: string;
  eventId?: number;
  createdById: number;
  createdAt: Date;
}

export async function updateStock(
  id: number,
  quantity: number,
  type: StockMovementType,
  userId: number,
  eventId?: number,
  notes?: string
): Promise<{ item: InventoryItem; movement: StockMovement }> {
  // Start transaction
  const connection = await executeQuery('BEGIN TRANSACTION');
  
  try {
    // Get current item with lock
    const currentItem = await executeQuery<InventoryItemAttributes>(
      'SELECT * FROM InventoryItems WITH (UPDLOCK) WHERE Id = @id',
      { id }
    );

    if (!currentItem[0]) {
      throw new Error('Item not found');
    }

    const previousQuantity = currentItem[0].quantity;
    const newQuantity = previousQuantity + quantity;

    if (newQuantity < 0) {
      throw new Error('Insufficient stock');
    }

    // Update inventory item
    const updatedItem = await executeQuery<InventoryItemAttributes>(
      `UPDATE InventoryItems
       SET Quantity = @newQuantity, UpdatedAt = GETUTCDATE(), UpdatedById = @userId
       OUTPUT INSERTED.*
       WHERE Id = @id`,
      { id, newQuantity, userId }
    );

    // Record stock movement
    const movement = await executeQuery<StockMovement>(
      `INSERT INTO StockMovements (
        InventoryItemId, Type, Quantity, PreviousQuantity,
        NewQuantity, Notes, EventId, CreatedById, CreatedAt
      )
      OUTPUT INSERTED.*
      VALUES (
        @id, @type, @quantity, @previousQuantity,
        @newQuantity, @notes, @eventId, @userId, GETUTCDATE()
      )`,
      {
        id,
        type,
        quantity,
        previousQuantity,
        newQuantity,
        notes,
        eventId,
        userId
      }
    );

    await executeQuery('COMMIT TRANSACTION');

    return {
      item: InventoryItem.create(updatedItem[0]),
      movement: movement[0]
    };
  } catch (error) {
    await executeQuery('ROLLBACK TRANSACTION');
    throw error;
  }
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  itemsByCategory: {
    category: ItemCategory;
    count: number;
    value: number;
  }[];
  mostUsedItems: {
    itemId: number;
    itemName: string;
    usageCount: number;
  }[];
}

export async function getInventoryStats(): Promise<InventoryStats> {
  const result = await executeQuery<InventoryStats>(
    `SELECT
      (SELECT COUNT(*) FROM InventoryItems WHERE IsActive = 1) as TotalItems,
      (SELECT SUM(Quantity * UnitPrice) FROM InventoryItems WHERE IsActive = 1) as TotalValue,
      (SELECT COUNT(*) FROM InventoryItems WHERE IsActive = 1 AND Quantity <= MinQuantity) as LowStockItems,
      (SELECT COUNT(*) FROM InventoryItems WHERE IsActive = 1 AND Quantity = 0) as OutOfStockItems,
      (
        SELECT Category, COUNT(*) as Count, SUM(Quantity * UnitPrice) as Value
        FROM InventoryItems
        WHERE IsActive = 1
        GROUP BY Category
        FOR JSON PATH
      ) as ItemsByCategory,
      (
        SELECT TOP 10
          i.Id as ItemId,
          i.Name as ItemName,
          COUNT(*) as UsageCount
        FROM StockMovements sm
        JOIN InventoryItems i ON sm.InventoryItemId = i.Id
        WHERE sm.Type IN ('event_allocation', 'sale')
        GROUP BY i.Id, i.Name
        ORDER BY COUNT(*) DESC
        FOR JSON PATH
      ) as MostUsedItems`
  );
  return result[0];
}

export interface SearchParams {
  category?: ItemCategory;
  location?: string;
  isActive?: boolean;
  lowStock?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listInventoryItems(
  params: SearchParams = {}
): Promise<{ items: InventoryItemWithUser[]; total: number }> {
  let whereClause = '1=1';
  const queryParams: any = {};

  if (params.category) {
    whereClause += ' AND Category = @category';
    queryParams.category = params.category;
  }
  if (params.location) {
    whereClause += ' AND Location = @location';
    queryParams.location = params.location;
  }
  if (params.isActive !== undefined) {
    whereClause += ' AND IsActive = @isActive';
    queryParams.isActive = params.isActive;
  }
  if (params.lowStock) {
    whereClause += ' AND Quantity <= MinQuantity';
  }
  if (params.search) {
    whereClause += ` AND (
      Name LIKE @search OR
      Description LIKE @search OR
      SKU LIKE @search OR
      Location LIKE @search
    )`;
    queryParams.search = `%${params.search}%`;
  }

  const sortBy = params.sortBy || 'Name';
  const sortOrder = params.sortOrder || 'asc';
  const limit = params.limit || 10;
  const offset = params.offset || 0;

  queryParams.limit = limit;
  queryParams.offset = offset;

  const countResult = await executeQuery<{ total: number }>(
    `SELECT COUNT(*) as total FROM InventoryItems WHERE ${whereClause}`,
    queryParams
  );

  const items = await executeQuery<InventoryItemWithUser>(
    `SELECT i.*,
      CONCAT(u1.FirstName, ' ', u1.LastName) as CreatedByName,
      CONCAT(u2.FirstName, ' ', u2.LastName) as UpdatedByName
    FROM InventoryItems i
    LEFT JOIN Users u1 ON i.CreatedById = u1.Id
    LEFT JOIN Users u2 ON i.UpdatedById = u2.Id
    WHERE ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY`,
    queryParams
  );

  return {
    items,
    total: countResult[0].total
  };
}

export default InventoryItem;
