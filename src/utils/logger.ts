// Browser-safe logger interface
interface LogContext {
  context?: string;
  [key: string]: any;
}

interface Logger {
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  child: (context: LogContext) => Logger;
}

const logger: Logger = {
  error: (...args: any[]) => console.error(...args),
  warn: (...args: any[]) => console.warn(...args),
  info: (...args: any[]) => console.info(...args),
  debug: (...args: any[]) => console.debug(...args),
  child: (context: LogContext) => ({
    ...logger,
    error: (...args: any[]) => console.error(...args, context),
    warn: (...args: any[]) => console.warn(...args, context),
    info: (...args: any[]) => console.info(...args, context),
    debug: (...args: any[]) => console.debug(...args, context)
  })
}

// Utility functions
export const logError = (error: Error, context: string = 'application', additionalInfo: Record<string, any> = {}) => {
  logger.error('[ERROR]', { context, error, ...additionalInfo });
};

export const logWarning = (message: string, context: string = 'application', additionalInfo: Record<string, any> = {}) => {
  logger.warn('[WARN]', { context, message, ...additionalInfo });
};

export const logInfo = (message: string, context: string = 'application', additionalInfo: Record<string, any> = {}) => {
  logger.info('[INFO]', { context, message, ...additionalInfo });
};

export const logDebug = (message: string, context: string = 'application', additionalInfo: Record<string, any> = {}) => {
  logger.debug('[DEBUG]', { context, message, ...additionalInfo });
};

// Performance logging
export const logPerformance = (operation: string, durationMs: number, additionalInfo: Record<string, any> = {}) => {
  logger.info('[PERF]', { context: 'performance', operation, durationMs, ...additionalInfo });
};

// Security logging
export const logSecurityEvent = (event: string, userId: number | string | null, additionalInfo: Record<string, any> = {}) => {
  logger.info('[SECURITY]', { context: 'security', event, userId, ...additionalInfo });
};

// Specialized loggers
export const createLogger = (context: string) => logger.child({ context });
export const requestLogger = createLogger('request');
export const dbLogger = createLogger('database');
export const authLogger = createLogger('auth');
export const eventLogger = createLogger('event');
export const inventoryLogger = createLogger('inventory');
export const emailLogger = createLogger('email');

export { logger };
