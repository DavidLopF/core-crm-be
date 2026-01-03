import { createLogger, format, transports } from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import 'colors';

const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const commonFormat = format.combine(
  format.errors({ stack: true }), // Captura el stack trace
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf((info) => {
    const message = (info as any).stack || info.message;
    return `[${(info as any).timestamp}] ${info.level}: ${message}`;
  }),
);

export const logger = createLogger({
  level: 'info',
  format: commonFormat,
  transports: [
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: format.combine(format.uncolorize(), commonFormat),
    }),
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: format.combine(format.uncolorize(), commonFormat),
    }),
  ],
});

if (process.env.NODE_ENV != 'production') {
  logger.add(
    new transports.Console({
      level: 'debug', // Muestra más detalles en desarrollo
      format: format.combine(
        format.colorize(),
        format.errors({ stack: true }), // Asegura que también se muestren los stack traces en consola
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf((info) => {
          const message = info.stack || info.message;
          return `[${info.timestamp}] ${info.level}: ${message}`;
        }),
      ),
    }),
  );
} else if (process.env.NODE_ENV === 'production') {
  logger.add(
    new transports.Console({
      level: 'info', // Muestra menos detalles en producción
      format: format.combine(
        // NO colorize en producción
        format.errors({ stack: true }), // Asegura que también se muestren los stack traces en consola
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf((info) => {
          const message = info.stack || info.message;
          return `[${info.timestamp}] ${info.level}: ${message}`;
        }),
      ),
    }),
  );
}

/**
 * printTitle
 * @param message
 */
export const printTitle = (message: string) => {
  logger.info('===================================================');
  logger.info(message.white.bold);
  logger.info('===================================================');
};

/**
 * printInfo
 * @param message
 */
export const printInfo = (message: string) => {
  logger.info(message);
};

/**
 * success
 * @param message
 */
export const success = (message: string) => {
  logger.info(message.green.bold);
};

/**
 * printError
 * @param error
 */
export const printError = (message: string | Error, error?: any) => {
  if (message instanceof Error) {
    logger.error(message);
  } else {
    logger.error(message.red.bold);
  }
  error && console.error(error);
};