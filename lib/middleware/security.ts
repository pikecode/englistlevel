import { NextRequest } from 'next/server'

/**
 * 安全响应头中间件
 */
export function withSecurityHeaders(handler: Function) {
  return async (request: NextRequest) => {
    const response = await handler(request)

    // 添加安全响应头
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

    // 添加 CSP 头
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    )

    return response
  }
}

/**
 * 请求日志中间件
 */
export function withRequestLogging(handler: Function) {
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
