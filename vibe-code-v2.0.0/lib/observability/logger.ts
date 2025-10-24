/**
 * Structured Logging
 * 
 * Sistema de logs estruturados com Pino para debugging produção.
 * Suporta diferentes níveis de log e contexto rico.
 * 
 * @layer MVP
 */

import pino from 'pino';

/**
 * Logger instance com configuração otimizada
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      hostname: bindings.hostname,
      service: 'vibe-code',
    }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'apiKey',
      'password',
      'token',
      'authorization',
      'cookie',
      '*.apiKey',
      '*.password',
      '*.token',
    ],
    remove: true,
  },
  // Production: JSON format
  // Development: Pretty print
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'HH:MM:ss',
      },
    },
  }),
});

/**
 * Logger with context
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Request logger middleware
 */
export function requestLogger(req: any, res: any, next: () => void) {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();

  const log = logger.child({
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
  });

  req.log = log;

  res.on('finish', () => {
    const duration = Date.now() - start;
    log.info(
      {
        statusCode: res.statusCode,
        duration,
      },
      'Request completed'
    );
  });

  next();
}

/**
 * Error logger
 */
export function logError(error: Error, context?: Record<string, any>) {
  logger.error(
    {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...context,
    },
    'Error occurred'
  );
}

/**
 * Performance logger
 */
export function logPerformance(operation: string, duration: number, metadata?: Record<string, any>) {
  logger.info(
    {
      operation,
      duration,
      ...metadata,
    },
    'Performance metric'
  );
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Enterprise Layer: Advanced logging
 */
export class EnterpriseLogger {
  // TODO: Add log aggregation (e.g., Datadog, Splunk)
  // TODO: Add alert triggers
  // TODO: Add custom log filters
  // TODO: Add log sampling for high-volume scenarios
}
