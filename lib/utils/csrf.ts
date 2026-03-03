import { NextRequest, NextResponse } from 'next/server'

/**
 * CSRF 防护中间件
 */
export function withCsrfProtection(handler: Function) {
  return async (request: NextRequest) => {
    // 对于 GET 请求，不需要 CSRF 保护
    if (request.method === 'GET') {
      return handler(request)
    }

    // 检查 CSRF token
    const csrfToken = request.headers.get('x-csrf-token')
    const sessionToken = request.cookies.get('csrf-token')?.value

    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
      return NextResponse.json(
        {
          code: 40009,
          message: 'CSRF token validation failed',
          data: null,
        },
        { status: 403 }
      )
    }

    return handler(request)
  }
}

/**
 * 生成 CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 验证 CSRF token
 */
export function validateCsrfToken(token: string, sessionToken: string): boolean {
  return token === sessionToken
}
