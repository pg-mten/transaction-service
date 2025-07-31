import { createLogger, format, LoggerOptions, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import 'winston-daily-rotate-file';
import { APP_NAME } from './global.constant';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

const { combine, timestamp, label, json, ms } = format;

// https://www.npmjs.com/package/winston#formats
// const myFormat = printf(({ level, message, label, timestamp, context }) => {
//   return `[${timestamp}] [${label}] [${level.toUpperCase()}]${context ? ` [${context}]` : ''} ${message}`;
// });

// https://www.npmjs.com/package/winston#logging-levels
enum logLevel {
  fatal = 'fatal',
  error = 'error',
  warn = 'warn',
  prisma = 'prisma',
  info = 'info',
  http = 'http',
  verbose = 'verbose',
  debug = 'debug',
  silly = 'silly',
}

export const logger = createLogger({
  level: logLevel.info,
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    prisma: 3,
    info: 4,
    http: 5,
    verbose: 6,
    debug: 7,
    silly: 8,
  },
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })),
  transports: [
    // new transports.Console({
    //   format: combine(
    //     label({ label: SERVICE_NAME }),
    //     timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    //     myFormat,
    //     colorize({ all: true }),
    //   ),
    // }),

    new transports.Console({
      level: logLevel.debug,
      format: combine(
        timestamp(),
        ms(),
        nestWinstonModuleUtilities.format.nestLike(APP_NAME, {
          colors: true,
          prettyPrint: true,
          processId: true,
          appName: true,
        }),
      ),
    }),

    // file on daily rotation (error only)
    new transports.DailyRotateFile({
      dirname: 'logs',
      // %DATE will be replaced by the current date
      filename: `%DATE%-error.log`,
      level: logLevel.error,
      format: combine(
        label({ label: APP_NAME }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        ms(),
        json(),
      ),
      zippedArchive: false, // do not want to zip our logs
      maxFiles: '30d', // will keep log until they are older than 30 days
    } as DailyRotateFile.DailyRotateFileTransportOptions),

    // Combine for all levels
    new transports.DailyRotateFile({
      dirname: 'logs',
      filename: `%DATE%-combined.log`,
      format: combine(
        label({ label: APP_NAME }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        ms(),
        json(),
      ),
      zippedArchive: false, // do not want to zip our logs
      maxFiles: '30d', // will keep log until they are older than 30 days
    }),
  ],
} as LoggerOptions);
