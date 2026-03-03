import winston from 'winston'
import path from 'path'

/**
 * 日志系统配置
 */

const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs')

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'englistlevel' },
  transports: [
    // 错误日志
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // 所有日志
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
})

// 开发环境下也输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} [${level}]: ${message}`
        })
      ),
    })
  )
}

export default logger

/**
 * 日志工具函数
 */

export function logInfo(message: string, meta?: any) {
  logger.info(message, meta)
}

export function logError(message: string, error?: Error, meta?: any) {
  logger.error(message, { error: error?.message, stack: error?.stack, ...meta })
}

export function logWarn(message: string, meta?: any) {
  logger.warn(message, meta)
}

export function logDebug(message: string, meta?: any) {
  logger.debug(message, meta)
}
