/**
 * Logger Utility
 * Winston-based logging with console and file support
 */

import winston from "winston";
import { existsSync, mkdirSync } from "fs";
import { config } from "./config.js";

// Ensure logs directory exists
if (!existsSync(config.storage.logsDir)) {
  mkdirSync(config.storage.logsDir, { recursive: true });
}

// Create logger
export const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "madlan-crawler" },
  transports: [
    // Write all logs to combined.log
    ...(config.logging.toFile
      ? [
          new winston.transports.File({
            filename: `${config.storage.logsDir}/error.log`,
            level: "error",
          }),
          new winston.transports.File({
            filename: `${config.storage.logsDir}/combined.log`,
          }),
        ]
      : []),

    // Write to console if enabled
    ...(config.logging.toConsole
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, ...meta }) => {
                return `${timestamp} [${level}]: ${message}${
                  Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ""
                }`;
              })
            ),
          }),
        ]
      : []),
  ],
});

// Create simple console-only logger for tests
export const consoleLogger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.log(`[DEBUG] ${message}`, ...args),
};
