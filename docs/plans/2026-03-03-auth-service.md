# 认证服务实现

**文件**:
- `lib/utils/jwt.ts`
- `lib/services/auth.service.ts`
- `app/api/v1/auth/wx-login/route.ts`

---

## 1. JWT 工具函数

**文件**: `lib/utils/jwt.ts`

```typescript
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

export interface JWTPayload {
  userId: string
  openid: string
  iat?: number
  exp?: number
}

/**
 * 生成 JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30d',
  })
}

/**
 * 验证 JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * 从 Authorization header 中提取 token
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  return parts[1]
}
```

---

## 2. 认证服务

**文件**: `lib/services/auth.service.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import { generateToken } from '@/lib/utils/jwt'

const prisma = new PrismaClient()

export interface WxLoginRequest {
  code: string
}

export interface WxLoginResponse {
  token: string
  userId: string
  isNewUser: boolean
  user: {
    nickname?: string
    avatarUrl?: string
    currentLevel: number
  }
}

/**
 * 微信登录服务
 *
 * 流程：
 * 1. 调用微信 API 用 code 换取 openid
 * 2. 查询数据库是否存在该用户
 * 3. 不存在则创建新用户
 * 4. 生成 JWT token 返回
 */
export async function wxLogin(req: WxLoginRequest): Promise<WxLoginResponse> {
  const { code } = req

  if (!code) {
    throw new Error('Code is required')
  }

  // TODO: 调用微信 API 获取 openid
  // 这里用 mock 数据演示
  const openid = `mock-openid-${code}`

  // 查询用户
  let user = await prisma.user.findUnique({
    where: { openid },
  })

  const isNewUser = !user

  // 新用户则创建
  if (!user) {
    user = await prisma.user.create({
      data: {
        openid,
        nickname: `User-${openid.slice(-6)}`,
        currentLevel: 1,
      },
    })

    // 为新用户创建第1级的进度记录
    await prisma.userLevelProgress.create({
      data: {
        userId: user.id,
        level: 1,
        totalSentences: 20,
        completedCount: 0,
        masteredCount: 0,
      },
    })
  }

  // 生成 token
  const token = generateToken({
    userId: user.id,
    openid: user.openid,
  })

  return {
    token,
    userId: user.id,
    isNewUser,
    user: {
      nickname: user.nickname || undefined,
      avatarUrl: user.avatarUrl || undefined,
      currentLevel: user.currentLevel,
    },
  }
}

/**
 * 获取用户信息
 */
export async function getUserInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      openid: true,
      nickname: true,
      avatarUrl: true,
      currentLevel: true,
      vipStatus: true,
      createdAt: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user
}
```

---

## 3. 微信登录 API 路由

**文件**: `app/api/v1/auth/wx-login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { wxLogin } from '@/lib/services/auth.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        {
          code: 40001,
          message: 'Code is required',
          data: null,
        },
        { status: 400 }
      )
    }

    const result = await wxLogin({ code })

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: result,
    })
  } catch (error) {
    console.error('Login error:', error)
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
```

---

## 4. 中间件：验证 Token

**文件**: `lib/middleware/auth.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'

export function withAuth(handler: Function) {
  return async (request: NextRequest) => {
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

    // 将 userId 注入到 request 中
    ;(request as any).userId = payload.userId
    ;(request as any).openid = payload.openid

    return handler(request)
  }
}
```

---

## 5. 使用示例

### 登录请求

```bash
curl -X POST http://localhost:3000/api/v1/auth/wx-login \
  -H "Content-Type: application/json" \
  -d '{"code":"test-code-123"}'
```

### 响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "clp1234567890",
    "isNewUser": true,
    "user": {
      "nickname": "User-123456",
      "avatarUrl": null,
      "currentLevel": 1
    }
  }
}
```

### 使用 Token 调用其他 API

```bash
curl -X GET http://localhost:3000/api/v1/user/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 6. 测试

### 单元测试

**文件**: `lib/utils/jwt.test.ts`

```typescript
import { generateToken, verifyToken } from './jwt'

describe('JWT Utils', () => {
  it('should generate and verify token', () => {
    const payload = { userId: 'user-123', openid: 'openid-123' }
    const token = generateToken(payload)
    const decoded = verifyToken(token)

    expect(decoded).toEqual(expect.objectContaining(payload))
  })

  it('should return null for invalid token', () => {
    const decoded = verifyToken('invalid-token')
    expect(decoded).toBeNull()
  })
})
```

### 集成测试

```bash
npm test -- lib/services/auth.service.test.ts
```

---

## 7. 环境变量

**文件**: `.env.local`

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/englistlevel"
JWT_SECRET="your-super-secret-key-change-in-production"
```

