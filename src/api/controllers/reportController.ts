import { Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors';
import { createLogger } from '../../utils/logger';
import {
  ReportType,
  ReportPeriod,
  getEventSummaryReport,
  getEventInspectionsReport,
  getInventoryValueReport,
  getInventoryMovementReport,
  getLowStockReport,
  getCategoryDistributionReport,
  reportRequestSchema,
  getDateRange
} from '../../models/Report';
import { AuthenticatedRequest } from '../../types/request';

const logger = createLogger('report');

export class ReportController {
  static async getAvailableReports(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'UNAUTHORIZED', 'User must be authenticated');
      }

      const reports = [
        {
          type: ReportType.EVENT_SUMMARY,
          name: 'Event Summary Report',
          description: 'Overview of events including status distribution and trends',
          supportedPeriods: [
            ReportPeriod.DAY,
            ReportPeriod.WEEK,
            ReportPeriod.MONTH,
            ReportPeriod.QUARTER,
            ReportPeriod.YEAR,
            ReportPeriod.CUSTOM
          ]
        },
        {
          type: ReportType.EVENT_INSPECTIONS,
          name: 'Event Inspections Report',
          description: 'Analysis of inspection completion rates and performance',
          supportedPeriods: [
            ReportPeriod.DAY,
            ReportPeriod.WEEK,
            ReportPeriod.MONTH,
            ReportPeriod.QUARTER,
            ReportPeriod.YEAR,
            ReportPeriod.CUSTOM
          ]
        },
        {
          type: ReportType.INVENTORY_VALUE,
          name: 'Inventory Value Report',
          description: 'Current inventory value and distribution by category',
          supportedPeriods: [ReportPeriod.DAY] // Point-in-time report
        },
        {
          type: ReportType.INVENTORY_MOVEMENT,
          name: 'Inventory Movement Report',
          description: 'Analysis of inventory transactions and stock movements',
          supportedPeriods: [
            ReportPeriod.DAY,
            ReportPeriod.WEEK,
            ReportPeriod.MONTH,
            ReportPeriod.QUARTER,
            ReportPeriod.YEAR,
            ReportPeriod.CUSTOM
          ]
        },
        {
          type: ReportType.LOW_STOCK,
          name: 'Low Stock Report',
          description: 'Items with stock levels at or below minimum quantity',
          supportedPeriods: [ReportPeriod.DAY] // Point-in-time report
        },
        {
          type: ReportType.CATEGORY_DISTRIBUTION,
          name: 'Category Distribution Report',
          description: 'Analysis of inventory distribution across categories',
          supportedPeriods: [ReportPeriod.DAY] // Point-in-time report
        }
      ];

      res.json({
        success: true,
        data: {
          reports,
          periods: Object.values(ReportPeriod)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async generateReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { type, period, startDate, endDate } = req.body;

      if (!req.user?.id) {
        throw new AppError(401, 'UNAUTHORIZED', 'User must be authenticated');
      }

      // Validate request using Zod schema
      reportRequestSchema.parse({
        type,
        period,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      });

      const dateRange = getDateRange(
        period as ReportPeriod,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      let reportData;
      switch (type) {
        case ReportType.EVENT_SUMMARY:
          reportData = await getEventSummaryReport(dateRange.start, dateRange.end);
          break;
        case ReportType.EVENT_INSPECTIONS:
          reportData = await getEventInspectionsReport(dateRange.start, dateRange.end);
          break;
        case ReportType.INVENTORY_VALUE:
          reportData = await getInventoryValueReport();
          break;
        case ReportType.INVENTORY_MOVEMENT:
          reportData = await getInventoryMovementReport(dateRange.start, dateRange.end);
          break;
        case ReportType.LOW_STOCK:
          reportData = await getLowStockReport();
          break;
        case ReportType.CATEGORY_DISTRIBUTION:
          reportData = await getCategoryDistributionReport();
          break;
        default:
          throw new AppError(400, 'INVALID_REPORT_TYPE', 'Invalid report type');
      }

      logger.info(
        { userId: req.user.id, reportType: type, period },
        'Report generated successfully'
      );

      res.json({
        success: true,
        data: {
          type,
          period,
          startDate: dateRange.start,
          endDate: dateRange.end,
          generatedAt: new Date(),
          report: reportData
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
