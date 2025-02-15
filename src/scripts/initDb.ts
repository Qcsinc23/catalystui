import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as sql from 'mssql';
import config from '../config';
import { logger } from '../utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbConfig: sql.config = {
  server: config.db.host,
  port: config.db.port,
  database: config.db.database,
  authentication: {
    type: 'default',
    options: {
      userName: config.db.user,
      password: config.db.password,
      ...(config.db.trustedConnection && { trustedConnection: true })
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

async function initializeDatabase() {
  let pool: sql.ConnectionPool | null = null;

  try {
    // Create connection pool
    pool = await new sql.ConnectionPool(dbConfig).connect();
    logger.info('Connected to database');

    // Read schema file
    const schemaPath = join(__dirname, '..', '..', 'migrations', '001_initial_schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');

    // Split schema into individual statements
    const statements = schema
      .split('\nGO\n')
      .filter(statement => statement.trim().length > 0);

    // Execute each statement
    for (const statement of statements) {
      try {
        await pool.request().query(statement);
        logger.info('Executed SQL statement successfully');
      } catch (error) {
        logger.error({
          err: error,
          statement: statement.substring(0, 100) + '...',
        }, 'Failed to execute SQL statement');
        throw error;
      }
    }

    logger.info('Database initialization completed successfully');

    // Create default admin user if it doesn't exist
    const adminEmail = 'admin@qcsmanagement.com';
    const adminPassword = 'Admin123!@#'; // This should be changed after first login

    const existingAdmin = await pool.request()
      .input('email', sql.NVarChar, adminEmail)
      .query('SELECT TOP 1 1 FROM Users WHERE Email = @email');

    if (!existingAdmin.recordset || existingAdmin.recordset.length === 0) {
      // Import bcrypt here to avoid top-level await
      const { genSaltSync, hashSync } = await import('bcrypt');
      
      const salt = genSaltSync(config.auth.saltRounds);
      const passwordHash = hashSync(adminPassword, salt);

      await pool.request()
        .input('email', sql.NVarChar, adminEmail)
        .input('passwordHash', sql.NVarChar, passwordHash)
        .input('firstName', sql.NVarChar, 'Admin')
        .input('lastName', sql.NVarChar, 'User')
        .input('role', sql.NVarChar, 'admin')
        .query(`
          INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Role, IsActive)
          VALUES (@email, @passwordHash, @firstName, @lastName, @role, 1)
        `);

      logger.info('Created default admin user');
      logger.info('Default admin credentials:');
      logger.info(`Email: ${adminEmail}`);
      logger.info('Password: Admin123!@#');
      logger.warn('Please change the admin password after first login');
    }

  } catch (error) {
    logger.error({ err: error }, 'Database initialization failed');
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      logger.info('Database connection closed');
    }
  }
}

// Run the initialization if this script is executed directly
if (import.meta.url === `file://${__filename}`) {
  initializeDatabase().catch((error) => {
    logger.error({ err: error }, 'Unhandled error during database initialization');
    process.exit(1);
  });
}

export default initializeDatabase;