import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from './config';
import { AppError, createErrorResponse } from './utils/errors';
import { logger } from './utils/logger';
import { initializeDatabase } from './utils/database';

// Import routes
import authRoutes from './api/routes/authRoutes';
import eventRoutes from './api/routes/eventRoutes';
import inspectionRoutes from './api/routes/inspectionRoutes';
import commentRoutes from './api/routes/commentRoutes';

// ES Module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize express app and router
const app = express();
const router = express.Router();

// Initialize middleware
const initializeMiddleware = async () => {
  // Import cors and middleware
  const corsModule = await import('cors');
  const { corsOptions, securityHeaders } = await import('./api/middleware/corsMiddleware');
  const { apiLimiter } = await import('./api/middleware/rateLimitMiddleware');

  // Apply security middleware first
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https:"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        "style-src": ["'self'", "'unsafe-inline'"]
      }
    }
  }));

  // Apply CORS
  app.use((corsModule as any)(corsOptions));

  // Apply security headers
  app.use((_req: Request, res: Response, next: NextFunction) => {
    Object.entries(securityHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    next();
  });

  // Rate limiting
  app.use('/api/', apiLimiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Mount routes
  router.use('/api/auth', authRoutes);
  router.use('/api/events', eventRoutes);

  // Mount router
  app.use(router);
};

// Mount inspection routes as sub-routes of events
router.use('/api/events/:eventId/inspections', (req, _res, next) => {
  try {
    // Validate eventId is a number
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid event ID');
    }
    next();
  } catch (error) {
    next(error);
  }
}, inspectionRoutes);

// Mount comment routes for events
router.use('/api/events/:entityId/comments', (req, _res, next) => {
  try {
    // Validate entityId is a number
    const entityId = parseInt(req.params.entityId);
    if (isNaN(entityId)) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid entity ID');
    }
    req.params.entityType = 'event';
    next();
  } catch (error) {
    next(error);
  }
}, commentRoutes);

// Mount comment routes for inspections
router.use('/api/events/:eventId/inspections/:entityId/comments', (req, _res, next) => {
  try {
    // Validate entityId is a number
    const entityId = parseInt(req.params.entityId);
    if (isNaN(entityId)) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid entity ID');
    }
    req.params.entityType = 'inspection';
    next();
  } catch (error) {
    next(error);
  }
}, commentRoutes);

// Static files
app.use('/uploads', express.static(join(__dirname, '..', config.storage.uploadDir)));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info({
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.body,
  }, 'Incoming request');
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, 'NOT_FOUND', 'Resource not found'));
});

// Global error handler
app.use((err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  const errorDetails = {
    stack: err.stack,
    ...err
  };

  logger.error({
    error: errorDetails
  }, err.message);

  const errorResponse = createErrorResponse(err);
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json(errorResponse);
});

// Start server
const startServer = async () => {
  try {
    // Initialize middleware
    logger.info('Initializing middleware...');
    await initializeMiddleware();
    logger.info('Middleware initialized');
    
    // Initialize database connection
    logger.info('Initializing database connection...');
    await initializeDatabase();
    logger.info('Database connection initialized');

    // Start listening
    logger.info('Starting server...');
    app.listen(config.app.port, () => {
      logger.info(
        `Server running in ${config.app.env} mode on port ${config.app.port}`
      );
      logger.info(`API URL: ${config.app.apiUrl}`);
      logger.info(`CORS enabled for origins: ${config.app.corsOrigin.join(', ')}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error({
    error: {
      stack: error.stack
    }
  }, error.message);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  const errorMessage = reason instanceof Error ? reason.message : String(reason);
  const errorStack = reason instanceof Error ? reason.stack : undefined;

  logger.error({
    error: {
      stack: errorStack
    }
  }, errorMessage);
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  process.exit(0);
});

// Start the server
if (import.meta.url === fileURLToPath(import.meta.url)) {
  startServer();
}

export default app;
