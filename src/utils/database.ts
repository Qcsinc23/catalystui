import * as sql from 'mssql';
import config from '../config';
import { logger } from './logger';

const dbConfig: sql.config = {
  server: config.db.host,
  database: config.db.database,
  user: 'qcs_admin',
  password: 'YourStrongPassword123!',
  options: {
    enableArithAbort: true,
    encrypt: false,
    trustServerCertificate: true,
    instanceName: 'SQLEXPRESS'
  }
};

let pool: sql.ConnectionPool | null = null;

export async function initializeDatabase() {
  try {
    if (!pool) {
      pool = await new sql.ConnectionPool(dbConfig).connect();
      logger.info('Database connection pool initialized');
    }
    return pool;
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize database connection pool');
    throw error;
  }
}

export async function getConnection() {
  if (!pool) {
    await initializeDatabase();
  }
  return pool!;
}

export async function executeQuery<T>(queryText: string, params: any = {}): Promise<T[] & { rowsAffected?: number[] }> {
  const connection = await getConnection();
  try {
    const request = connection.request();
    
    // Add parameters to the request
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });

    const result = await request.query(queryText);
    const recordset = result.recordset || [];
    Object.defineProperty(recordset, 'rowsAffected', {
      value: result.rowsAffected,
      enumerable: true
    });
    return recordset;
  } catch (error) {
    logger.error({ err: error, query: queryText, params }, 'Database query failed');
    throw error;
  }
}

export async function execute(procedure: string, params: any = {}): Promise<any> {
  const connection = await getConnection();
  try {
    const request = connection.request();
    
    // Add parameters to the request
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });

    const result = await request.execute(procedure);
    return result;
  } catch (error) {
    logger.error({ err: error, procedure, params }, 'Stored procedure execution failed');
    throw error;
  }
}

// Cleanup function to close the connection pool
export async function closeDatabase() {
  if (pool) {
    try {
      await pool.close();
      pool = null;
      logger.info('Database connection pool closed');
    } catch (error) {
      logger.error({ err: error }, 'Error closing database connection pool');
      throw error;
    }
  }
}

// Handle cleanup on process termination
process.on('SIGTERM', async () => {
  await closeDatabase();
});

process.on('SIGINT', async () => {
  await closeDatabase();
});
