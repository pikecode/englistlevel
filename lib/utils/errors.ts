import { NextResponse } from 'next/server'

export interface ApiError {
  code: number
  message: string
  details?: any
}

export class AppError extends Error {
  constructor(
    public code: number,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// 常见错误
export const Errors = {
  // 参数错误
  INVALID_PARAMS: new AppError(40001, 'Invalid parameters', 400),
  MISSING_PARAMS: new AppError(40001, 'Missing required parameters', 400),

  // 认证错误
  UNAUTHORIZED: new AppError(40003, 'Unauthorized', 401),
  INVALID_TOKEN: new AppError(40003, 'Invalid token', 401),
  TOKEN_EXPIRED: new AppError(40003, 'Token expired', 401),

  // 权限错误
  FORBIDDEN: new AppError(40009, 'Forbidden', 403),

  // 业务错误
  INSUFFICIENT_BEANS: new AppError(41001, 'Insufficient beans balance', 400),
  LEVEL_MISMATCH: new AppError(41002, 'Level mismatch', 400),

  // 订单错误
  INVALID_ORDER_STATUS: new AppError(42001, 'Invalid order status', 400),
  IDEMPOTENCY_CONFLICT: new AppError(42002, 'Idempotency conflict', 409),

  // 服务器错误
  INTERNAL_ERROR: new AppError(50000, 'Internal server error', 500),
  DATABASE_ERROR: new AppError(50000, 'Database error', 500),
  EXTERNAL_SERVICE_ERROR: new AppError(50000, 'External service error', 500),
}

/**
 * 创建错误响应
 */
export function createErrorResponse(error: any) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message,
        data: null,
        details: error.details,
      },
      { status: error.statusCode }
    )
  }

  console.error('Unexpected error:', error)

  return NextResponse.json(
    {
      code: 50000,
      message: 'Internal server error',
      data: null,
    },
    { status: 500 }
  )
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(data: T, message: string = 'ok') {
  return NextResponse.json({
    code: 0,
    message,
    data,
  })
}
