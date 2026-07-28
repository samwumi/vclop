import * as winston from 'winston';
import 'winston-daily-rotate-file';

export function buildWinstonConfig(): winston.LoggerOptions {
  const isProduction = process.env.NODE_ENV === 'production';

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.ms(),
        isProduction
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize({ all: true }),
              winston.format.printf(({ timestamp, level, message, context, ms, ...meta }) => {
                const ctx = context ? ` [${String(context)}]` : '';
                const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                return `${String(timestamp)} ${level}${ctx}: ${String(message)}${metaStr} ${String(ms ?? '')}`;
              }),
            ),
      ),
    }),
  ];

  if (isProduction) {
    transports.push(
      new winston.transports.DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxFiles: '30d',
        maxSize: '20m',
        zippedArchive: true,
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }) as winston.transport,
      new winston.transports.DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '14d',
        maxSize: '50m',
        zippedArchive: true,
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }) as winston.transport,
    );
  }

  return {
    level: isProduction ? 'info' : 'debug',
    transports,
    exitOnError: false,
  };
}
