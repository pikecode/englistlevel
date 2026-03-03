# 学习服务实现

**文件**:
- `lib/repositories/sentence.repository.ts`
- `lib/repositories/progress.repository.ts`
- `lib/services/learning.service.ts`
- `app/api/v1/learning/current-level/route.ts`
- `app/api/v1/learning/progress/route.ts`
- `app/api/v1/learning/complete-level/route.ts`

---

## 1. 句子 Repository

**文件**: `lib/repositories/sentence.repository.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class SentenceRepository {
  /**
   * 获取指定等级的所有句子
   */
  async getSentencesByLevel(level: number) {
    return prisma.sentence.findMany({
      where: {
        level,
        status: 'active',
      },
      orderBy: { seqNo: 'asc' },
    })
  }

  /**
   * 获取单个句子
   */
  async getSentenceById(sentenceId: string) {
    return prisma.sentence.findUnique({
      where: { id: sentenceId },
    })
  }

  /**
   * 创建句子
   */
  async createSentence(data: {
    level: number
    seqNo: number
    enText: string
    zhText: string
    audioUrl?: string
  }) {
    return prisma.sentence.create({
      data,
    })
  }

  /**
   * 批量创建句子
   */
  async createMany(sentences: Array<{
    level: number
    seqNo: number
    enText: string
    zhText: string
    audioUrl?: string
  }>) {
    return prisma.sentence.createMany({
      data: sentences,
      skipDuplicates: true,
    })
  }

  /**
   * 获取等级范围内的句子总数
   */
  async getSentenceCount(level: number) {
    return prisma.sentence.count({
      where: {
        level,
        status: 'active',
      },
    })
  }
}
```

---

## 2. 进度 Repository

**文件**: `lib/repositories/progress.repository.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class ProgressRepository {
  /**
   * 获取用户指定等级的进度
   */
  async getLevelProgress(userId: string, level: number) {
    return prisma.userLevelProgress.findUnique({
      where: {
        userId_level: {
          userId,
          level,
        },
      },
    })
  }

  /**
   * 创建等级进度记录
   */
  async createLevelProgress(userId: string, level: number) {
    return prisma.userLevelProgress.create({
      data: {
        userId,
        level,
        totalSentences: 20,
        completedCount: 0,
        masteredCount: 0,
      },
    })
  }

  /**
   * 更新句子掌握度
   */
  async updateSentenceMastery(
    userId: string,
    sentenceId: string,
    masteryScore: number
  ) {
    return prisma.userSentenceMastery.upsert({
      where: {
        userId_sentenceId: {
          userId,
          sentenceId,
        },
      },
      update: {
        masteryScore,
        lastPracticedAt: new Date(),
      },
      create: {
        userId,
        sentenceId,
        masteryScore,
        lastPracticedAt: new Date(),
      },
    })
  }

  /**
   * 获取用户在某等级的掌握度统计
   */
  async getLevelMasteryStats(userId: string, level: number) {
    const masteries = await prisma.userSentenceMastery.findMany({
      where: {
        userId,
        sentence: {
          level,
        },
      },
      select: {
        masteryScore: true,
      },
    })

    const completedCount = masteries.filter((m) => m.masteryScore > 0).length
    const masteredCount = masteries.filter((m) => m.masteryScore >= 80).length

    return {
      completedCount,
      masteredCount,
      totalCount: 20,
    }
  }

  /**
   * 标记等级为已完成
   */
  async markLevelAsPassed(userId: string, level: number) {
    return prisma.userLevelProgress.update({
      where: {
        userId_level: {
          userId,
          level,
        },
      },
      data: {
        isPassed: true,
        passedAt: new Date(),
      },
    })
  }

  /**
   * 更新等级进度
   */
  async updateLevelProgress(
    userId: string,
    level: number,
    data: {
      completedCount?: number
      masteredCount?: number
    }
  ) {
    return prisma.userLevelProgress.update({
      where: {
        userId_level: {
          userId,
          level,
        },
      },
      data,
    })
  }
}
```

---

## 3. 学习 Service

**文件**: `lib/services/learning.service.ts`

```typescript
import { SentenceRepository } from '@/lib/repositories/sentence.repository'
import { ProgressRepository } from '@/lib/repositories/progress.repository'
import { UserRepository } from '@/lib/repositories/user.repository'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const sentenceRepo = new SentenceRepository()
const progressRepo = new ProgressRepository()
const userRepo = new UserRepository()

export class LearningService {
  /**
   * 获取用户当前等级的学习内容
   */
  async getCurrentLevelContent(userId: string) {
    const user = await userRepo.findById(userId)
    if (!user) throw new Error('User not found')

    const level = user.currentLevel

    // 获取该等级的所有句子
    const sentences = await sentenceRepo.getSentencesByLevel(level)

    if (sentences.length === 0) {
      throw new Error(`No sentences found for level ${level}`)
    }

    // 获取用户在该等级的进度
    let progress = await progressRepo.getLevelProgress(userId, level)

    // 如果没有进度记录，创建一个
    if (!progress) {
      progress = await progressRepo.createLevelProgress(userId, level)
    }

    return {
      level,
      sentences: sentences.map((s) => ({
        id: s.id,
        enText: s.enText,
        zhText: s.zhText,
        audioUrl: s.audioUrl,
        seqNo: s.seqNo,
      })),
      progress: {
        completedCount: progress.completedCount,
        masteredCount: progress.masteredCount,
        totalSentences: 20,
      },
    }
  }

  /**
   * 记录句子学习进度
   */
  async recordSentenceProgress(
    userId: string,
    sentenceId: string,
    masteryScore: number
  ) {
    // 验证 masteryScore 范围
    if (masteryScore < 0 || masteryScore > 100) {
      throw new Error('Mastery score must be between 0 and 100')
    }

    // 更新掌握度
    await progressRepo.updateSentenceMastery(userId, sentenceId, masteryScore)

    // 获取句子信息
    const sentence = await sentenceRepo.getSentenceById(sentenceId)
    if (!sentence) throw new Error('Sentence not found')

    // 更新等级进度统计
    const stats = await progressRepo.getLevelMasteryStats(
      userId,
      sentence.level
    )

    await progressRepo.updateLevelProgress(userId, sentence.level, {
      completedCount: stats.completedCount,
      masteredCount: stats.masteredCount,
    })

    return {
      sentenceId,
      masteryScore,
      levelStats: stats,
    }
  }

  /**
   * 完成当前等级
   * 检查是否满足升级条件，满足则升级
   */
  async completeLevelAndCheckUpgrade(userId: string) {
    const user = await userRepo.findById(userId)
    if (!user) throw new Error('User not found')

    const currentLevel = user.currentLevel

    // 获取当前等级的进度
    const progress = await progressRepo.getLevelProgress(userId, currentLevel)
    if (!progress) throw new Error('Progress not found')

    // 升级条件：完成 20 句（completedCount >= 20）
    if (progress.completedCount < 20) {
      throw new Error(
        `Cannot upgrade: only ${progress.completedCount}/20 sentences completed`
      )
    }

    // 标记当前等级为已完成
    await progressRepo.markLevelAsPassed(userId, currentLevel)

    // 升级用户
    const newLevel = Math.min(currentLevel + 1, 100)
    const updatedUser = await userRepo.upgradeLevel(userId)

    // 为新等级创建进度记录
    if (newLevel <= 100) {
      await progressRepo.createLevelProgress(userId, newLevel)
    }

    return {
      oldLevel: currentLevel,
      newLevel: updatedUser.currentLevel,
      upgraded: newLevel > currentLevel,
      message:
        newLevel > currentLevel
          ? `Congratulations! You've reached level ${newLevel}!`
          : 'You have reached the maximum level!',
    }
  }

  /**
   * 获取用户学习统计
   */
  async getLearningStats(userId: string) {
    const user = await userRepo.findById(userId)
    if (!user) throw new Error('User not found')

    // 获取已完成的等级数
    const completedLevels = await prisma.userLevelProgress.count({
      where: {
        userId,
        isPassed: true,
      },
    })

    // 获取总掌握度
    const masteredSentences = await prisma.userSentenceMastery.count({
      where: {
        userId,
        masteryScore: { gte: 80 },
      },
    })

    // 获取总学习句子数
    const totalPracticed = await prisma.userSentenceMastery.count({
      where: { userId },
    })

    return {
      currentLevel: user.currentLevel,
      completedLevels,
      masteredSentences,
      totalPracticed,
      progressPercentage: Math.round((completedLevels / 100) * 100),
    }
  }
}
```

---

## 4. API 路由

### 获取当前等级内容

**文件**: `app/api/v1/learning/current-level/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { LearningService } from '@/lib/services/learning.service'

const learningService = new LearningService()

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json(
        { code: 40003, message: 'Unauthorized', data: null },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { code: 40003, message: 'Invalid token', data: null },
        { status: 401 }
      )
    }

    const content = await learningService.getCurrentLevelContent(payload.userId)

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: content,
    })
  } catch (error) {
    console.error('Get current level error:', error)
    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}
```

### 记录学习进度

**文件**: `app/api/v1/learning/progress/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { LearningService } from '@/lib/services/learning.service'

const learningService = new LearningService()

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json(
        { code: 40003, message: 'Unauthorized', data: null },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { code: 40003, message: 'Invalid token', data: null },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { sentenceId, masteryScore } = body

    if (!sentenceId || masteryScore === undefined) {
      return NextResponse.json(
        { code: 40001, message: 'Missing required fields', data: null },
        { status: 400 }
      )
    }

    const result = await learningService.recordSentenceProgress(
      payload.userId,
      sentenceId,
      masteryScore
    )

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: result,
    })
  } catch (error) {
    console.error('Record progress error:', error)
    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}
```

### 完成等级

**文件**: `app/api/v1/learning/complete-level/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { LearningService } from '@/lib/services/learning.service'

const learningService = new LearningService()

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json(
        { code: 40003, message: 'Unauthorized', data: null },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { code: 40003, message: 'Invalid token', data: null },
        { status: 401 }
      )
    }

    const result = await learningService.completeLevelAndCheckUpgrade(
      payload.userId
    )

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: result,
    })
  } catch (error: any) {
    console.error('Complete level error:', error)

    // 如果是业务错误（如未完成所有句子）
    if (error.message.includes('Cannot upgrade')) {
      return NextResponse.json(
        { code: 40001, message: error.message, data: null },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}
```

---

## 5. 使用示例

### 获取当前等级内容

```bash
curl -X GET http://localhost:3000/api/v1/learning/current-level \
  -H "Authorization: Bearer <token>"
```

### 响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "level": 1,
    "sentences": [
      {
        "id": "sent-001",
        "enText": "Hello, how are you?",
        "zhText": "你好，你好吗？",
        "audioUrl": "https://example.com/audio/001.mp3",
        "seqNo": 1
      }
    ],
    "progress": {
      "completedCount": 0,
      "masteredCount": 0,
      "totalSentences": 20
    }
  }
}
```

### 记录学习进度

```bash
curl -X POST http://localhost:3000/api/v1/learning/progress \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sentenceId": "sent-001",
    "masteryScore": 85
  }'
```

### 完成等级

```bash
curl -X POST http://localhost:3000/api/v1/learning/complete-level \
  -H "Authorization: Bearer <token>"
```

### 响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "oldLevel": 1,
    "newLevel": 2,
    "upgraded": true,
    "message": "Congratulations! You've reached level 2!"
  }
}
```

