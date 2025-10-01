/**
 * Structured Logging Utility for Stratford AI
 *
 * Provides consistent, deterministic logging across the application
 * with environment-specific configuration.
 */

import { env, envConfig } from './env';

// Log levels (ordered by severity)
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

// Log level mapping from string to enum
const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  silent: LogLevel.SILENT,
};

// Get current log level from environment
const currentLogLevel = LOG_LEVEL_MAP[envConfig.LOG_LEVEL] ?? LogLevel.INFO;

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: keyof typeof LogLevel;
  message: string;
  data?: any;
  module?: string;
  sessionId?: string;
}

// Console colors for different log levels
const COLORS = {
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m',  // Green
  WARN: '\x1b[33m',  // Yellow
  ERROR: '\x1b[31m', // Red
  SILENT: '\x1b[90m', // Gray
  RESET: '\x1b[0m',  // Reset
} as const;

class Logger {
  private sessionId: string;

  constructor() {
    // Generate deterministic session ID for tracking
    this.sessionId = `session_${Date.now()}_${env.STRATFORD_RANDOM_SEED}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= currentLogLevel;
  }

  private formatMessage(level: keyof typeof LogLevel, message: string, data?: any, module?: string): string {
    const timestamp = new Date().toISOString();
    const modulePrefix = module ? `[${module}] ` : '';
    const color = COLORS[level];
    const reset = COLORS.RESET;

    let formattedMessage = `${color}[${timestamp}] ${level}: ${modulePrefix}${message}${reset}`;

    if (data) {
      formattedMessage += `\n${color}Data: ${JSON.stringify(data, null, 2)}${reset}`;
    }

    return formattedMessage;
  }

  private logToConsole(level: keyof typeof LogLevel, message: string, data?: any, module?: string): void {
    if (!env.ENABLE_CONSOLE_LOGS) return;

    const formattedMessage = this.formatMessage(level, message, data, module);

    switch (level) {
      case 'DEBUG':
        console.debug(formattedMessage);
        break;
      case 'INFO':
        console.info(formattedMessage);
        break;
      case 'WARN':
        console.warn(formattedMessage);
        break;
      case 'ERROR':
        console.error(formattedMessage);
        break;
    }
  }

  private createLogEntry(level: keyof typeof LogLevel, message: string, data?: any, module?: string): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      sessionId: this.sessionId,
    };

    if (data !== undefined) {
      entry.data = data;
    }

    if (module !== undefined) {
      entry.module = module;
    }

    return entry;
  }

  debug(message: string, data?: any, module?: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    this.logToConsole('DEBUG', message, data, module);

    // In production, you might want to send to logging service
    if (env.NODE_ENV === 'production') {
      // TODO: Send to structured logging service
    }
  }

  info(message: string, data?: any, module?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    this.logToConsole('INFO', message, data, module);
  }

  warn(message: string, data?: any, module?: string): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    this.logToConsole('WARN', message, data, module);
  }

  error(message: string, error?: Error | any, module?: string): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    let errorData = error;

    // Extract useful information from Error objects
    if (error instanceof Error) {
      errorData = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      };
    }

    this.logToConsole('ERROR', message, errorData, module);
  }

  // Performance logging for financial calculations
  time(label: string, module?: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    console.time(label);
    this.debug(`Timer started: ${label}`, undefined, module);
  }

  timeEnd(label: string, module?: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    console.timeEnd(label);
    this.debug(`Timer ended: ${label}`, undefined, module);
  }

  // Audit logging for financial operations
  audit(action: string, data: any, module?: string): void {
    const auditEntry = this.createLogEntry('INFO', `AUDIT: ${action}`, data, module);

    this.info(`AUDIT: ${action}`, data, module);

    // In production, audit logs should be sent to secure storage
    if (env.NODE_ENV === 'production') {
      // TODO: Send to audit logging service
    }
  }

  // Strategy execution logging
  strategy(message: string, data?: any): void {
    this.info(message, data, 'STRATEGY');
  }

  // Data processing logging
  data(message: string, data?: any): void {
    this.debug(message, data, 'DATA');
  }

  // API call logging
  api(message: string, data?: any): void {
    this.debug(message, data, 'API');
  }

  // Performance metrics logging
  performance(message: string, data?: any): void {
    this.info(message, data, 'PERFORMANCE');
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for common logging patterns
export const log = {
  debug: (message: string, data?: any, module?: string) => logger.debug(message, data, module),
  info: (message: string, data?: any, module?: string) => logger.info(message, data, module),
  warn: (message: string, data?: any, module?: string) => logger.warn(message, data, module),
  error: (message: string, error?: Error | any, module?: string) => logger.error(message, error, module),
  audit: (action: string, data: any, module?: string) => logger.audit(action, data, module),
  strategy: (message: string, data?: any) => logger.strategy(message, data),
  data: (message: string, data?: any) => logger.data(message, data),
  api: (message: string, data?: any) => logger.api(message, data),
  performance: (message: string, data?: any) => logger.performance(message, data),
  time: (label: string, module?: string) => logger.time(label, module),
  timeEnd: (label: string, module?: string) => logger.timeEnd(label, module),
};