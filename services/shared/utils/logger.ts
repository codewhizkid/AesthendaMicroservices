/**
 * Structured logging utility for consistent logging across services
 * Includes tenant context and request information
 */

import { Request, Response } from 'express';

type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

/**
 * Context information for log entries
 */
interface LogContext {
  tenantId?: string;
  requestId?: string;
  userId?: string;
  service?: string;
  [key: string]: unknown; // Replacing any with unknown for additional properties
}

interface LoggerOptions {
  defaultLevel?: LogLevel;
  serviceName: string;
  environment?: string;
  shouldPrettyPrint?: boolean;
}

/**
 * Interface for logger instances
 */
export interface Logger {
  error(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  trace(message: string, context?: LogContext): void;
  child(childContext: LogContext): Logger;
  forTenant(tenantId: string): Logger;
  forRequest(requestId: string, tenantId?: string, userId?: string): Logger;
}

/**
 * Create a logger instance with tenant awareness
 */
export function createLogger(options: LoggerOptions): Logger {
  const {
    serviceName,
    environment = process.env.NODE_ENV || "development",
    shouldPrettyPrint = environment === "development",
  } = options;

  /**
   * Core logging function with consistent format
   */
  function logMessage(
    level: LogLevel,
    message: string,
    context: LogContext = {},
  ) {
    // Add service name to context
    const fullContext = {
      ...context,
      service: context.service || serviceName,
      environment,
      timestamp: new Date().toISOString(),
    };

    // Create structured log object
    const logObject = {
      level,
      message,
      ...fullContext,
    };

    // Output the log
    if (shouldPrettyPrint) {
      // Pretty format for development
      console[level === "trace" ? "debug" : level](
        `[${level.toUpperCase()}][${fullContext.service}] ${message}`,
        {
          tenantId: fullContext.tenantId,
          requestId: fullContext.requestId,
          userId: fullContext.userId,
          ...fullContext,
        },
      );
    } else {
      // JSON format for production environments (easier to parse by log aggregators)
      console[level === "trace" ? "debug" : level](JSON.stringify(logObject));
    }
  }

  // Return the logger interface
  return {
    /**
     * Log an error message
     */
    error(message: string, context?: LogContext) {
      logMessage("error", message, context);
    },

    /**
     * Log a warning message
     */
    warn(message: string, context?: LogContext) {
      logMessage("warn", message, context);
    },

    /**
     * Log an info message
     */
    info(message: string, context?: LogContext) {
      logMessage("info", message, context);
    },

    /**
     * Log a debug message
     */
    debug(message: string, context?: LogContext) {
      if (process.env.LOG_LEVEL === "debug" || environment === "development") {
        logMessage("debug", message, context);
      }
    },

    /**
     * Log a trace message (very detailed debugging)
     */
    trace(message: string, context?: LogContext) {
      if (process.env.LOG_LEVEL === "trace") {
        logMessage("trace", message, context);
      }
    },

    /**
     * Create a child logger with additional context
     */
    child(childContext: LogContext) {
      const childLogger = {
        error: (message: string, context?: LogContext) =>
          logMessage("error", message, { ...childContext, ...context }),
        warn: (message: string, context?: LogContext) =>
          logMessage("warn", message, { ...childContext, ...context }),
        info: (message: string, context?: LogContext) =>
          logMessage("info", message, { ...childContext, ...context }),
        debug: (message: string, context?: LogContext) => {
          if (
            process.env.LOG_LEVEL === "debug" ||
            environment === "development"
          ) {
            logMessage("debug", message, { ...childContext, ...context });
          }
        },
        trace: (message: string, context?: LogContext) => {
          if (process.env.LOG_LEVEL === "trace") {
            logMessage("trace", message, { ...childContext, ...context });
          }
        },
        child: function(nestedContext: LogContext) {
          return createLogger(options).child({
            ...childContext,
            ...nestedContext
          });
        },
        forTenant: function(tenantId: string) {
          return this.child({ tenantId });
        },
        forRequest: function(requestId: string, tenantId?: string, userId?: string) {
          return this.child({ requestId, tenantId, userId });
        }
      };

      return childLogger;
    },

    /**
     * Create a tenant-specific logger
     */
    forTenant(tenantId: string) {
      return this.child({ tenantId });
    },

    /**
     * Create a request-specific logger
     */
    forRequest(requestId: string, tenantId?: string, userId?: string) {
      return this.child({ requestId, tenantId, userId });
    },
  };
}

/**
 * Type for the express request with logger
 */
export interface RequestWithLogger extends Request {
  logger: Logger;
  tenantId?: string;
  user?: {
    id: string;
    tenantId?: string;
    [key: string]: unknown; // Replacing any with unknown
  };
}

/**
 * Create middleware to attach a request-specific logger to the request object
 */
export function createLoggerMiddleware(logger: Logger) {
  return (req: RequestWithLogger, res: Response, next: () => void) => {
    // Extract context information
    const requestId =
      req.headers["x-request-id"] ||
      `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const tenantId = req.headers["x-tenant-id"] || req.tenantId;
    const userId = req.user?.id;

    // Create request-specific logger
    req.logger = logger.forRequest(
      typeof requestId === 'string' ? requestId : Array.isArray(requestId) ? requestId[0] : String(requestId),
      typeof tenantId === 'string' ? tenantId : Array.isArray(tenantId) ? tenantId[0] : tenantId ? String(tenantId) : undefined,
      userId
    );

    // Add request ID header
    res.setHeader("X-Request-ID", requestId);

    // Log request start in debug mode
    req.logger.debug(`Request started: ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
    });

    // Track response time
    const startTime = Date.now();

    // Log response when finished
    res.on("finish", () => {
      const duration = Date.now() - startTime;
      const level =
        res.statusCode >= 500
          ? "error"
          : res.statusCode >= 400
          ? "warn"
          : "debug";

      req.logger[level](
        `Request completed: ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`,
        {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
        },
      );
    });

    next();
  };
}
