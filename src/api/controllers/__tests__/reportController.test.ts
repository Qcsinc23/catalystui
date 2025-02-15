import { Response } from 'express';
import { ReportController } from '../reportController';
import { AppError } from '../../../utils/errors';
import {
  ReportType,
  ReportPeriod,
  getEventSummaryReport
} from '../../../models/Report';
import { AuthenticatedRequest } from '../../../types/request';

// Mock the Report model functions
jest.mock('../../../models/Report', () => ({
  ...jest.requireActual('../../../models/Report'),
  getEventSummaryReport: jest.fn()
}));

describe('ReportController', () => {
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

  describe('getAvailableReports', () => {
    it('should return list of available reports and periods', async () => {
      await ReportController.getAvailableReports(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          reports: expect.arrayContaining([
            expect.objectContaining({
              type: expect.any(String),
              name: expect.any(String),
              description: expect.any(String),
              supportedPeriods: expect.any(Array)
            })
          ]),
          periods: expect.arrayContaining(Object.values(ReportPeriod))
        }
      });
    });

    it('should throw error if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await ReportController.getAvailableReports(
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

  describe('generateReport', () => {
    const mockEventSummary = {
      totalEvents: 10,
      upcomingEvents: 5,
      completedEvents: 3,
      cancelledEvents: 2
    };

    beforeEach(() => {
      (getEventSummaryReport as jest.Mock).mockResolvedValue(mockEventSummary);
    });

    it('should generate event summary report', async () => {
      mockRequest.body = {
        type: ReportType.EVENT_SUMMARY,
        period: ReportPeriod.MONTH
      };

      await ReportController.generateReport(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(getEventSummaryReport).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          type: ReportType.EVENT_SUMMARY,
          period: ReportPeriod.MONTH,
          report: mockEventSummary
        })
      });
    });

    it('should throw error for invalid report type', async () => {
      mockRequest.body = {
        type: 'invalid_type',
        period: ReportPeriod.MONTH
      };

      await ReportController.generateReport(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(
        expect.any(AppError)
      );
      const error = nextFunction.mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid report type');
    });

    it('should validate custom period dates', async () => {
      mockRequest.body = {
        type: ReportType.EVENT_SUMMARY,
        period: ReportPeriod.CUSTOM,
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      };

      await ReportController.generateReport(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(getEventSummaryReport).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          type: ReportType.EVENT_SUMMARY,
          period: ReportPeriod.CUSTOM,
          startDate: expect.any(Date),
          endDate: expect.any(Date)
        })
      });
    });

    it('should throw error if user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = {
        type: ReportType.EVENT_SUMMARY,
        period: ReportPeriod.MONTH
      };

      await ReportController.generateReport(
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
