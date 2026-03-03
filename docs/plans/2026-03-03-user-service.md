# 用户服务实现

**文件**:
- `lib/repositories/user.repository.ts`
- `lib/services/user.service.ts`
- `app/api/v1/user/profile/route.ts`

---

## 1. 用户 Repository

**文件**: `lib/repositories/user.repository.ts`

```typescript
import { PrismaClient, User } from '@prisma/client'

const prisma = new PrismaClient()

export class UserRepository {
  /**
   * 根据 ID 获取用户
   */
  async findById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
    })
  }

  /**
   * 根据 openid 获取用户
   */
  async findByOpenid(openid: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { openid },
    })
  }

  /**
   * 创建用户
   */
  async create(data: {
    openid: string
    nickname?: string
    avatarUrl?: string
  }): Promise<User> {
    return prisma.user.create({
      data: {
        openid: data.openid,
        nickname: data.nickname,
        avatarUrl: data.avatarUrl,
        currentLevel: 1,
      },
    })
  }

  /**
   * 更新用户
   */
  async update(
    userId: string,
    data: {
      nickname?: string
      avatarUrl?: string
      currentLevel?: number
      vipStatus?: string
    }
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data,
    })
  }

  /**
   * 升级用户等级
   */
  async upgradeLevel(userId: string): Promise<User> {
    const user = await this.findById(userId)
    if (!user) throw new Error('User not found')

    const newLevel = Math.min(user.currentLevel + 1, 100)

    return prisma.user.update({
      where: { id: userId },
      data: { currentLevel: newLevel },
    })
  }

  /**
   * 获取用户的学习统计
   */
  async getUserStats(userId: string) {
    const user = await this.findById(userId)
    if (!user) throw new Error('User not found')

    // 获取已完成的等级数
    const completedLevels = await prisma.userLevelProgress.count({
      where: {
        userId,
        isPassed: true,
      },
    })

    // 获取已掌握的句子数
    const masteredSentences = await prisma.userSentenceMastery.count({
      where: {
        userId,
        masteryScore: { gte: 80 },
      },
    })

    return {
      userId,
      currentLevel: user.currentLevel,
      completedLevels,
      masteredSentences,
      totalPracticed: await prisma.userSentenceMastery.count({
        where: { userId },
      }),
    }
  }
}
```

---

## 2. 用户 Service

**文件**: `lib/services/user.service.ts`

```typescript
import { UserRepository } from '@/lib/repositories/user.repository'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const userRepository = new UserRepository()

export class UserService {
  /**
   * 获取用户完整信息
   */
  async getUserProfile(userId: string) {
    const user = await userRepository.findById(userId)
    if (!user) throw new Error('User not found')

    const stats = await userRepository.getUserStats(userId)

    // 获取当前等级的进度
    const currentProgress = await prisma.userLevelProgress.findUnique({
      where: {
        userId_level: {
          userId,
          level: user.currentLevel,
        },
      },
    })

    return {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      currentLevel: user.currentLevel,
      vipStatus: user.vipStatus,
      createdAt: user.createdAt,
      stats,
      currentProgress: {
        level: user.currentLevel,
        completedCount: currentProgress?.completedCount || 0,
        masteredCount: currentProgress?.masteredCount || 0,
        totalSentences: 20,
      },
    }
  }

  /**
   * 更新用户信息
   */
  async updateUserProfile(
    userId: string,
    data: {
      nickname?: string
      avatarUrl?: string
    }
  ) {
    const updated = await userRepository.update(userId, data)
    return this.getUserProfile(updated.id)
  }

  /**
   * 获取用户排行榜排名
   */
  async getUserRanking(userId: string) {
    const user = await userRepository.findById(userId)
    if (!user) throw new Error('User not found')

    // 获取比该用户等级高的用户数
    const higherRank = await prisma.user.count({
      where: {
        currentLevel: { gt: user.currentLevel },
      },
    })

    // 获取同等级的用户数
    const sameLevel = await prisma.user.count({
      where: {
        currentLevel: user.currentLevel,
      },
    })

    return {
      userId,
      currentLevel: user.currentLevel,
      rank: higherRank + 1,
      totalUsers: await prisma.user.count(),
      sameLevelUsers: sameLevel,
    }
  }
}
```

---

## 3. 用户 API 路由

**文件**: `app/api/v1/user/profile/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { UserService } from '@/lib/services/user.service'

const userService = new UserService()

/**
 * GET /api/v1/user/profile
 * 获取用户个人信息
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 token
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

    const profile = await userService.getUserProfile(payload.userId)

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: profile,
    })
  } catch (error) {
    console.error('Get profile error:', error)
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

/**
 * PATCH /api/v1/user/profile
 * 更新用户信息
 */
export async function PATCH(request: NextRequest) {
  try {
    // 验证 token
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

    const body = await request.json()
    const { nickname, avatarUrl } = body

    const updated = await userService.updateUserProfile(payload.userId, {
      nickname,
      avatarUrl,
    })

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: updated,
    })
  } catch (error) {
    console.error('Update profile error:', error)
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

## 4. 排行榜 API 路由

**文件**: `app/api/v1/user/ranking/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { UserService } from '@/lib/services/user.service'
import { PrismaClient } from '@prisma/client'

const userService = new UserService()
const prisma = new PrismaClient()

/**
 * GET /api/v1/user/ranking
 * 获取用户排行榜排名
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 token
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

    const ranking = await userService.getUserRanking(payload.userId)

    // 获取前 10 名用户
    const topUsers = await prisma.user.findMany({
      orderBy: { currentLevel: 'desc' },
      take: 10,
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        currentLevel: true,
      },
    })

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: {
        myRanking: ranking,
        topUsers,
      },
    })
  } catch (error) {
    console.error('Get ranking error:', error)
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

## 5. 测试

### 单元测试

**文件**: `lib/services/user.service.test.ts`

```typescript
import { UserService } from './user.service'
import { UserRepository } from '@/lib/repositories/user.repository'

jest.mock('@/lib/repositories/user.repository')

describe('UserService', () => {
  let userService: UserService
  let mockRepository: jest.Mocked<UserRepository>

  beforeEach(() => {
    mockRepository = new UserRepository() as jest.Mocked<UserRepository>
    userService = new UserService()
  })

  it('should get user profile', async () => {
    const mockUser = {
      id: 'user-123',
      openid: 'openid-123',
      nickname: 'Test User',
      avatarUrl: null,
      currentLevel: 5,
      vipStatus: 'free',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockRepository.findById.mockResolvedValue(mockUser)

    const profile = await userService.getUserProfile('user-123')

    expect(profile.id).toBe('user-123')
    expect(profile.currentLevel).toBe(5)
  })
})
```

### 集成测试

```bash
npm test -- lib/services/user.service.test.ts
```

---

## 6. 使用示例

### 获取用户信息

```bash
curl -X GET http://localhost:3000/api/v1/user/profile \
  -H "Authorization: Bearer <token>"
```

### 响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "clp1234567890",
    "openid": "mock-openid-123456",
    "nickname": "User-123456",
    "avatarUrl": null,
    "currentLevel": 1,
    "vipStatus": "free",
    "createdAt": "2026-03-03T10:00:00Z",
    "stats": {
      "userId": "clp1234567890",
      "currentLevel": 1,
      "completedLevels": 0,
      "masteredSentences": 0,
      "totalPracticed": 0
    },
    "currentProgress": {
      "level": 1,
      "completedCount": 0,
      "masteredCount": 0,
      "totalSentences": 20
    }
  }
}
```

### 更新用户信息

```bash
curl -X PATCH http://localhost:3000/api/v1/user/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "New Nickname",
    "avatarUrl": "https://example.com/avatar.jpg"
  }'
```

### 获取排行榜

```bash
curl -X GET http://localhost:3000/api/v1/user/ranking \
  -H "Authorization: Bearer <token>"
```

