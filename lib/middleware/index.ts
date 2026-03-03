import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '../utils/jwt'

/**
 * 认证中间件
 */
export function withAuth(handler: Function) {
  return async (request: NextRequest) => {
    try {
      const token = extractTokenFromHeader(request.headers.get('authorization'))

      if (!token) {
        return NextResponse.json(
          {
            code: 40003,
            message: 'Unauthorized',
            data: null,
          },
          { status: 401 }
        )
      }

      const payload = verifyToken(token)

      if (!payload) {
        return NextResponse.json(
          {
            code: 40003,
            message: 'Invalid token',
            data: null,
          },
          { status: 401 }
        )
      }

      // 将用户信息注入到请求中
      ;(request as any).userId = payload.userId
      ;(request as any).openid = payload.openid

      return handler(request)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        {
          code: 50000,
          message: 'Internal server error',
          data: null,
        },
        { status: 500 }
      )
    }
  }
}

/**
 * 日志中间件
 */
export function withLogging(handler: Function) {
  return async (request: NextRequest) => {
    const startTime = Date.now()
    const method = request.method
    const url = request.nextUrl.pathname

    try {
      const response = await handler(request)
      const duration = Date.now() - startTime

      console.log(`[${method}] ${url} - ${response.status} (${duration}ms)`)

      return response
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[${method}] ${url} - ERROR (${duration}ms)`, error)
      throw error
    }
  }
}

/**
 * 速率限制中间件（简单实现）
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (handler: Function) => {
    return async (request: NextRequest) => {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      const now = Date.now()

      let record = requestCounts.get(ip)

      if (!record || now > record.resetTime) {
        record = { count: 0, resetTime: now + windowMs }
        requestCounts.set(ip, record)
      }

      record.count++

      if (record.count > maxRequests) {
        return NextResponse.json(
          {
            code: 42900,
            message: 'Too many requests',
            data: null,
          },
          { status: 429 }
        )
      }

      return handler(request)
    }
  }
}

/**
 * 组合多个中间件
 */
export function compose(...middlewares: Function[]) {
  return (handler: Function) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}
