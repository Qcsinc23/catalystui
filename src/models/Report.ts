import { z } from 'zod';
import { executeQuery } from '../utils/database';
import { ItemCategory } from './InventoryItem';

// Define report types
export enum ReportType {
  EVENT_SUMMARY = 'event_summary',
  EVENT_INSPECTIONS = 'event_inspections',
  INVENTORY_VALUE = 'inventory_value',
  INVENTORY_MOVEMENT = 'inventory_movement',
  LOW_STOCK = 'low_stock',
  CATEGORY_DISTRIBUTION = 'category_distribution'
}

// Define report period
export enum ReportPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom'
}

// Define report interfaces
export interface EventSummaryReport {
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  averageInspectionsPerEvent: number;
  inspectionCompletionRate: number;
  eventsByStatus: {
    status: string;
    count: number;
  }[];
  eventsByMonth: {
    month: string;
    count: number;
  }[];
}

export interface EventInspectionsReport {
  totalInspections: number;
  completedInspections: number;
  failedInspections: number;
  pendingInspections: number;
  overdueInspections: number;
  averageCompletionTime: number;
  inspectionsByType: {
    type: string;
    count: number;
    passRate: number;
  }[];
  inspectionsByInspector: {
    inspectorId: number;
    inspectorName: string;
    assigned: number;
    completed: number;
    failed: number;
    averageCompletionTime: number;
  }[];
}

export interface InventoryValueReport {
  totalValue: number;
  valueByCategory: {
    category: ItemCategory;
    itemCount: number;
    totalValue: number;
    percentageOfTotal: number;
  }[];
  valueByLocation: {
    location: string;
    itemCount: number;
    totalValue: number;
    percentageOfTotal: number;
  }[];
  valueOverTime: {
    date: string;
    totalValue: number;
  }[];
}

export interface InventoryMovementReport {
  totalMovements: number;
  netQuantityChange: number;
  movementsByType: {
    type: string;
    count: number;
    totalQuantity: number;
  }[];
  topItemsByMovement: {
    itemId: number;
    itemName: string;
    movements: number;
    netChange: number;
  }[];
  movementsByDay: {
    date: string;
    inbound: number;
    outbound: number;
  }[];
}

export interface LowStockReport {
  totalLowStockItems: number;
  totalOutOfStockItems: number;
  lowStockItems: {
    itemId: number;
    itemName: string;
    category: ItemCategory;
    currentQuantity: number;
    minQuantity: number;
    lastRestockDate: Date;
    averageMonthlyUsage: number;
  }[];
  categoryBreakdown: {
    category: ItemCategory;
    lowStockCount: number;
    outOfStockCount: number;
  }[];
}

export interface CategoryDistributionReport {
  totalItems: number;
  totalValue: number;
  categories: {
    category: ItemCategory;
    itemCount: number;
    totalValue: number;
    percentageByCount: number;
    percentageByValue: number;
    averageItemValue: number;
  }[];
}

// Database Operations

export async function getEventSummaryReport(
  startDate?: Date,
  endDate?: Date
): Promise<EventSummaryReport> {
  const dateFilter = startDate && endDate
    ? 'AND StartDate BETWEEN @startDate AND @endDate'
    : '';

  const result = await executeQuery<EventSummaryReport>(
    `SELECT
      COUNT(*) as TotalEvents,
      SUM(CASE WHEN StartDate > GETUTCDATE() THEN 1 ELSE 0 END) as UpcomingEvents,
      SUM(CASE WHEN Status = 'completed' THEN 1 ELSE 0 END) as CompletedEvents,
      SUM(CASE WHEN Status = 'cancelled' THEN 1 ELSE 0 END) as CancelledEvents,
      AVG(CAST((SELECT COUNT(*) FROM EventInspections WHERE EventId = e.Id) as float)) as AverageInspectionsPerEvent,
      CAST(
        SUM(CASE WHEN i.Status = 'completed' THEN 1 ELSE 0 END) as float
      ) / NULLIF(COUNT(i.Id), 0) as InspectionCompletionRate,
      (
        SELECT Status, COUNT(*) as Count
        FROM Events
        WHERE Status IS NOT NULL ${dateFilter}
        GROUP BY Status
        FOR JSON PATH
      ) as EventsByStatus,
      (
        SELECT 
          FORMAT(DATEADD(month, DATEDIFF(month, 0, StartDate), 0), 'yyyy-MM') as Month,
          COUNT(*) as Count
        FROM Events
        WHERE StartDate IS NOT NULL ${dateFilter}
        GROUP BY DATEADD(month, DATEDIFF(month, 0, StartDate), 0)
        ORDER BY Month
        FOR JSON PATH
      ) as EventsByMonth
    FROM Events e
    LEFT JOIN EventInspections i ON e.Id = i.EventId
    WHERE 1=1 ${dateFilter}`,
    { startDate, endDate }
  );

  return result[0];
}

export async function getEventInspectionsReport(
  startDate?: Date,
  endDate?: Date
): Promise<EventInspectionsReport> {
  const dateFilter = startDate && endDate
    ? 'AND i.CreatedAt BETWEEN @startDate AND @endDate'
    : '';

  const result = await executeQuery<EventInspectionsReport>(
    `SELECT
      COUNT(*) as TotalInspections,
      SUM(CASE WHEN Status = 'completed' THEN 1 ELSE 0 END) as CompletedInspections,
      SUM(CASE WHEN Status = 'failed' THEN 1 ELSE 0 END) as FailedInspections,
      SUM(CASE WHEN Status = 'pending' THEN 1 ELSE 0 END) as PendingInspections,
      SUM(CASE WHEN DueDate < GETUTCDATE() AND Status NOT IN ('completed', 'failed') THEN 1 ELSE 0 END) as OverdueInspections,
      AVG(CASE 
        WHEN Status = 'completed' 
        THEN DATEDIFF(hour, CreatedAt, CompletedAt) 
        ELSE NULL 
      END) as AverageCompletionTime,
      (
        SELECT Type,
          COUNT(*) as Count,
          CAST(
            SUM(CASE WHEN Status = 'completed' THEN 1 ELSE 0 END) as float
          ) / COUNT(*) as PassRate
        FROM EventInspections
        WHERE Type IS NOT NULL ${dateFilter}
        GROUP BY Type
        FOR JSON PATH
      ) as InspectionsByType,
      (
        SELECT 
          i.AssignedTo as InspectorId,
          CONCAT(u.FirstName, ' ', u.LastName) as InspectorName,
          COUNT(*) as Assigned,
          SUM(CASE WHEN i.Status = 'completed' THEN 1 ELSE 0 END) as Completed,
          SUM(CASE WHEN i.Status = 'failed' THEN 1 ELSE 0 END) as Failed,
          AVG(CASE 
            WHEN i.Status = 'completed' 
            THEN DATEDIFF(hour, i.CreatedAt, i.CompletedAt) 
            ELSE NULL 
          END) as AverageCompletionTime
        FROM EventInspections i
        JOIN Users u ON i.AssignedTo = u.Id
        WHERE 1=1 ${dateFilter}
        GROUP BY i.AssignedTo, u.FirstName, u.LastName
        FOR JSON PATH
      ) as InspectionsByInspector
    FROM EventInspections i
    WHERE 1=1 ${dateFilter}`,
    { startDate, endDate }
  );

  return result[0];
}

export async function getInventoryValueReport(): Promise<InventoryValueReport> {
  const result = await executeQuery<InventoryValueReport>(
    `SELECT
      SUM(Quantity * UnitPrice) as TotalValue,
      (
        SELECT 
          Category,
          COUNT(*) as ItemCount,
          SUM(Quantity * UnitPrice) as TotalValue,
          CAST(SUM(Quantity * UnitPrice) as float) / 
            SUM(SUM(Quantity * UnitPrice)) OVER() as PercentageOfTotal
        FROM InventoryItems
        WHERE IsActive = 1
        GROUP BY Category
        FOR JSON PATH
      ) as ValueByCategory,
      (
        SELECT 
          Location,
          COUNT(*) as ItemCount,
          SUM(Quantity * UnitPrice) as TotalValue,
          CAST(SUM(Quantity * UnitPrice) as float) / 
            SUM(SUM(Quantity * UnitPrice)) OVER() as PercentageOfTotal
        FROM InventoryItems
        WHERE IsActive = 1
        GROUP BY Location
        FOR JSON PATH
      ) as ValueByLocation,
      (
        SELECT 
          CAST(CreatedAt as date) as Date,
          SUM(Quantity * UnitPrice) as TotalValue
        FROM InventoryItems
        WHERE IsActive = 1
        GROUP BY CAST(CreatedAt as date)
        ORDER BY Date
        FOR JSON PATH
      ) as ValueOverTime
    FROM InventoryItems
    WHERE IsActive = 1`
  );

  return result[0];
}

export async function getInventoryMovementReport(
  startDate?: Date,
  endDate?: Date
): Promise<InventoryMovementReport> {
  const dateFilter = startDate && endDate
    ? 'AND CreatedAt BETWEEN @startDate AND @endDate'
    : '';

  const result = await executeQuery<InventoryMovementReport>(
    `SELECT
      COUNT(*) as TotalMovements,
      SUM(Quantity) as NetQuantityChange,
      (
        SELECT 
          Type,
          COUNT(*) as Count,
          SUM(Quantity) as TotalQuantity
        FROM StockMovements
        WHERE 1=1 ${dateFilter}
        GROUP BY Type
        FOR JSON PATH
      ) as MovementsByType,
      (
        SELECT TOP 10
          i.Id as ItemId,
          i.Name as ItemName,
          COUNT(*) as Movements,
          SUM(sm.Quantity) as NetChange
        FROM StockMovements sm
        JOIN InventoryItems i ON sm.InventoryItemId = i.Id
        WHERE 1=1 ${dateFilter}
        GROUP BY i.Id, i.Name
        ORDER BY COUNT(*) DESC
        FOR JSON PATH
      ) as TopItemsByMovement,
      (
        SELECT 
          CAST(CreatedAt as date) as Date,
          SUM(CASE WHEN Quantity > 0 THEN Quantity ELSE 0 END) as Inbound,
          ABS(SUM(CASE WHEN Quantity < 0 THEN Quantity ELSE 0 END)) as Outbound
        FROM StockMovements
        WHERE 1=1 ${dateFilter}
        GROUP BY CAST(CreatedAt as date)
        ORDER BY Date
        FOR JSON PATH
      ) as MovementsByDay
    FROM StockMovements
    WHERE 1=1 ${dateFilter}`,
    { startDate, endDate }
  );

  return result[0];
}

export async function getLowStockReport(): Promise<LowStockReport> {
  const result = await executeQuery<LowStockReport>(
    `WITH ItemUsage AS (
      SELECT 
        InventoryItemId,
        ABS(SUM(CASE WHEN Quantity < 0 THEN Quantity ELSE 0 END)) / 
          CAST(DATEDIFF(month, MIN(CreatedAt), GETUTCDATE()) as float) as MonthlyUsage
      FROM StockMovements
      GROUP BY InventoryItemId
    )
    SELECT
      (SELECT COUNT(*) FROM InventoryItems WHERE Quantity <= MinQuantity AND IsActive = 1) as TotalLowStockItems,
      (SELECT COUNT(*) FROM InventoryItems WHERE Quantity = 0 AND IsActive = 1) as TotalOutOfStockItems,
      (
        SELECT 
          i.Id as ItemId,
          i.Name as ItemName,
          i.Category,
          i.Quantity as CurrentQuantity,
          i.MinQuantity,
          (
            SELECT MAX(CreatedAt)
            FROM StockMovements
            WHERE InventoryItemId = i.Id AND Quantity > 0
          ) as LastRestockDate,
          COALESCE(iu.MonthlyUsage, 0) as AverageMonthlyUsage
        FROM InventoryItems i
        LEFT JOIN ItemUsage iu ON i.Id = iu.InventoryItemId
        WHERE i.Quantity <= i.MinQuantity AND i.IsActive = 1
        FOR JSON PATH
      ) as LowStockItems,
      (
        SELECT 
          Category,
          SUM(CASE WHEN Quantity <= MinQuantity THEN 1 ELSE 0 END) as LowStockCount,
          SUM(CASE WHEN Quantity = 0 THEN 1 ELSE 0 END) as OutOfStockCount
        FROM InventoryItems
        WHERE IsActive = 1
        GROUP BY Category
        FOR JSON PATH
      ) as CategoryBreakdown`
  );

  return result[0];
}

export async function getCategoryDistributionReport(): Promise<CategoryDistributionReport> {
  const result = await executeQuery<CategoryDistributionReport>(
    `WITH CategoryStats AS (
      SELECT
        Category,
        COUNT(*) as ItemCount,
        SUM(Quantity * UnitPrice) as TotalValue
      FROM InventoryItems
      WHERE IsActive = 1
      GROUP BY Category
    )
    SELECT
      (SELECT COUNT(*) FROM InventoryItems WHERE IsActive = 1) as TotalItems,
      (SELECT SUM(Quantity * UnitPrice) FROM InventoryItems WHERE IsActive = 1) as TotalValue,
      (
        SELECT 
          cs.Category,
          cs.ItemCount,
          cs.TotalValue,
          CAST(cs.ItemCount as float) / SUM(cs.ItemCount) OVER() as PercentageByCount,
          CAST(cs.TotalValue as float) / SUM(cs.TotalValue) OVER() as PercentageByValue,
          cs.TotalValue / cs.ItemCount as AverageItemValue
        FROM CategoryStats cs
        FOR JSON PATH
      ) as Categories`
  );

  return result[0];
}

// Report generation validation
export const reportRequestSchema = z.object({
  type: z.nativeEnum(ReportType),
  period: z.nativeEnum(ReportPeriod),
  startDate: z.date().optional(),
  endDate: z.date().optional()
}).refine(
  (data) => {
    if (data.period === ReportPeriod.CUSTOM) {
      return data.startDate && data.endDate && data.startDate <= data.endDate;
    }
    return true;
  },
  {
    message: 'Custom period requires valid start and end dates'
  }
);

// Helper function to get date range based on period
export function getDateRange(period: ReportPeriod, startDate?: Date, endDate?: Date): { start: Date; end: Date } {
  const now = new Date();
  
  if (period === ReportPeriod.CUSTOM && startDate && endDate) {
    return { start: startDate, end: endDate };
  }

  const end = new Date(now);
  const start = new Date(now);

  switch (period) {
    case ReportPeriod.DAY:
      start.setDate(start.getDate() - 1);
      break;
    case ReportPeriod.WEEK:
      start.setDate(start.getDate() - 7);
      break;
    case ReportPeriod.MONTH:
      start.setMonth(start.getMonth() - 1);
      break;
    case ReportPeriod.QUARTER:
      start.setMonth(start.getMonth() - 3);
      break;
    case ReportPeriod.YEAR:
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      throw new Error('Invalid report period');
  }

  return { start, end };
}
