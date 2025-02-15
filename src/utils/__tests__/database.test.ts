import { jest } from '@jest/globals';
import * as sql from 'mssql';
import {
  initializeDatabase,
  getConnection,
  executeQuery,
  execute,
  closeDatabase,
} from '../database';
import { logger } from '../logger';

jest.mock('mssql');
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Database Utility', () => {
  let mockPool: Partial<sql.ConnectionPool>;
  let mockRequest: Partial<sql.Request>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn(),
      execute: jest.fn(),
    };

    mockPool = {
      connect: jest.fn(),
      close: jest.fn(),
      request: jest.fn().mockReturnValue(mockRequest),
    };

    (sql.ConnectionPool as jest.Mock).mockImplementation(() => mockPool);
  });

  describe('initializeDatabase', () => {
    it('should initialize database connection pool', async () => {
      mockPool.connect = jest.fn().mockResolvedValue(mockPool);
      const result = await initializeDatabase();
      expect(sql.ConnectionPool).toHaveBeenCalled();
      expect(mockPool.connect).toHaveBeenCalled();
      expect(result).toBe(mockPool);
      expect(logger.info).toHaveBeenCalledWith('Database connection pool initialized');
    });

    it('should reuse existing pool if already initialized', async () => {
      mockPool.connect = jest.fn().mockResolvedValue(mockPool);
      await initializeDatabase();
      jest.clearAllMocks();
      const result = await initializeDatabase();
      expect(sql.ConnectionPool).not.toHaveBeenCalled();
      expect(mockPool.connect).not.toHaveBeenCalled();
      expect(result).toBe(mockPool);
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Connection failed');
      mockPool.connect = jest.fn().mockRejectedValueOnce(error);
      await expect(initializeDatabase()).rejects.toThrow('Connection failed');
      expect(logger.error).toHaveBeenCalledWith(
        { err: error },
        'Failed to initialize database connection pool',
      );
    });
  });

  describe('getConnection', () => {
    it('should return existing pool if initialized', async () => {
      mockPool.connect = jest.fn().mockResolvedValue(mockPool);
      await initializeDatabase();
      jest.clearAllMocks();
      const result = await getConnection();
      expect(sql.ConnectionPool).not.toHaveBeenCalled();
      expect(result).toBe(mockPool);
    });

    it('should initialize pool if not already initialized', async () => {
      mockPool.connect = jest.fn().mockResolvedValue(mockPool);
      const result = await getConnection();
      expect(sql.ConnectionPool).toHaveBeenCalled();
      expect(mockPool.connect).toHaveBeenCalled();
      expect(result).toBe(mockPool);
    });
  });

  describe('executeQuery', () => {
    it('should execute query without parameters', async () => {
      await initializeDatabase();
      const query = 'SELECT * FROM users';
      const mockResult = [{ id: 1, name: 'Test' }];
      (mockRequest.query as jest.Mock).mockResolvedValueOnce({ recordset: mockResult });
      const result = await executeQuery(query);
      expect(mockPool.request).toHaveBeenCalled();
      expect(mockRequest.query).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });

    it('should execute query with parameters', async () => {
      await initializeDatabase();
      const query = 'SELECT * FROM users WHERE id = @id';
      const params = { id: 1 };
      const mockResult = [{ id: 1, name: 'Test' }];

      (mockRequest.query as jest.Mock).mockResolvedValueOnce({ recordset: mockResult });
      const result = await executeQuery(query, params);

      expect(mockRequest.input).toHaveBeenCalledWith('id', params.id);
      expect(mockRequest.query).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });
  });

  describe('execute', () => {
    it('should execute stored procedure without parameters', async () => {
      await initializeDatabase();
      const procedure = 'GetUsers';
      const mockResult = { returnValue: 0 };
      (mockRequest.execute as jest.Mock).mockResolvedValueOnce(mockResult);
      const result = await execute(procedure);
      expect(mockPool.request).toHaveBeenCalled();
      expect(mockRequest.execute).toHaveBeenCalledWith(procedure);
      expect(result).toEqual(mockResult);
    });

    it('should execute stored procedure with parameters', async () => {
      await initializeDatabase();
      const procedure = 'GetUserById';
      const params = { id: 1, role: 'admin' };
      const mockResult = { returnValue: 0 };
      (mockRequest.execute as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await execute(procedure, params);

      expect(mockRequest.input).toHaveBeenCalledWith('id', params.id);
      expect(mockRequest.input).toHaveBeenCalledWith('role', params.role);

      expect(mockRequest.execute).toHaveBeenCalledWith(procedure);
      expect(result).toEqual(mockResult);
    });
  });

  describe('closeDatabase', () => {
    it('should close database connection pool', async () => {
      await initializeDatabase();
      await closeDatabase();
      expect(mockPool.close).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Database connection pool closed');
    });

    it('should handle close errors', async () => {
      const error = new Error('Close failed');
      mockPool.close = jest.fn().mockRejectedValueOnce(error);
      await initializeDatabase();
      await expect(closeDatabase()).rejects.toThrow('Close failed');
      expect(logger.error).toHaveBeenCalledWith(
        { err: error },
        'Error closing database connection pool',
      );
    });
  });
});
