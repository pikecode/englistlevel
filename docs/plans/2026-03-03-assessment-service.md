# 测评服务实现

**文件**:
- `lib/repositories/assessment.repository.ts`
- `lib/services/assessment.service.ts`
- `app/api/v1/assessment/start/route.ts`
- `app/api/v1/assessment/submit/route.ts`

---

## 1. 测评 Repository

**文件**: `lib/repositories/assessment.repository.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class AssessmentRepository {
  /**
   * 创建测评记录
   */
  async createAssessment(data: {
    userId: string
    score: number
    questionCount: number
    correctCount: number
    suggestedLevel: number
    confirmedLevel: number
  }) {
    return prisma.assessment.create({
      data,
    })
  }

  /**
   * 获取用户的测评历史
   */
  async getUserAssessments(userId: string) {
    return prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
  }

  /**
   * 获取用户最近的测评
   */
  async getLatestAssessment(userId: string) {
    return prisma.assessment.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * 检查用户是否已进行过测评
   */
  async hasUserTakenAssessment(userId: string) {
    const count = await prisma.assessment.count({
      where: { userId },
    })
    return count > 0
  }
}
```

---

## 2. 测评 Service

**文件**: `lib/services/assessment.service.ts`

```typescript
import { AssessmentRepository } from '@/lib/repositories/assessment.repository'
import { SentenceRepository } from '@/lib/repositories/sentence.repository'
import { ProgressRepository } from '@/lib/repositories/progress.repository'
import { UserRepository } from '@/lib/repositories/user.repository'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const assessmentRepo = new AssessmentRepository()
const sentenceRepo = new SentenceRepository()
const progressRepo = new ProgressRepository()
const userRepo = new UserRepository()

// 测评题库：从1-2级的句子中随机抽取
const ASSESSMENT_QUESTION_COUNT = 20

export class AssessmentService {
  /**
   * 生成测评试卷
   * 从1-2级的句子中随机抽取20题
   */
  async generateAssessmentQuestions() {
    // 获取1-2级的所有句子
    const level1Sentences = await sentenceRepo.getSentencesByLevel(1)
    const level2Sentences = await sentenceRepo.getSentencesByLevel(2)

    const allSentences = [...level1Sentences, ...level2Sentences]

    if (allSentences.length < ASSESSMENT_QUESTION_COUNT) {
      throw new Error('Not enough sentences for assessment')
    }

    // 随机抽取 20 题
    const questions = this.shuffleArray(allSentences).slice(
      0,
      ASSESSMENT_QUESTION_COUNT
    )

    return questions.map((sentence) => ({
      id: sentence.id,
      enText: sentence.enText,
      zhText: sentence.zhText,
      audioUrl: sentence.audioUrl,
      // 生成选项：正确答案 + 3个干扰项
      options: this.generateOptions(sentence.zhText, allSentences),
    }))
  }

  /**
   * 生成选项（1个正确答案 + 3个干扰项）
   */
  private generateOptions(correctAnswer: string, allSentences: any[]) {
    const options = [correctAnswer]

    // 从其他句子中随机选择3个作为干扰项
    const distractors = this.shuffleArray(allSentences)
      .filter((s) => s.zhText !== correctAnswer)
      .slice(0, 3)
      .map((s) => s.zhText)

    options.push(...distractors)

    // 打乱选项顺序
    return this.shuffleArray(options)
  }

  /**
   * 数组随机排序
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * 提交测评答案并计算成绩
   */
  async submitAssessment(
    userId: string,
    answers: Array<{
      questionId: string
      selectedAnswer: string
    }>
  ) {
    if (answers.length !== ASSESSMENT_QUESTION_COUNT) {
      throw new Error(
        `Expected ${ASSESSMENT_QUESTION_COUNT} answers, got ${answers.length}`
      )
    }

    // 计算正确数
    let correctCount = 0

    for (const answer of answers) {
      const sentence = await sentenceRepo.getSentenceById(answer.questionId)
      if (!sentence) continue

      // 检查答案是否正确
      if (sentence.zhText === answer.selectedAnswer) {
        correctCount++
      }
    }

    // 计算分数（百分制）
    const score = Math.round((correctCount / ASSESSMENT_QUESTION_COUNT) * 100)

    // 根据分数推荐等级
    // 规则：
    // 0-40: 推荐等级 1
    // 41-70: 推荐等级 5
    // 71-100: 推荐等级 10
    const suggestedLevel = this.calculateSuggestedLevel(score)

    // 创建测评记录
    const assessment = await assessmentRepo.createAssessment({
      userId,
      score,
      questionCount: ASSESSMENT_QUESTION_COUNT,
      correctCount,
      suggestedLevel,
      confirmedLevel: suggestedLevel, // 初始值为推荐等级
    })

    // 更新用户等级
    const user = await userRepo.findById(userId)
    if (user && user.currentLevel === 1) {
      // 只在首次测评时更新用户等级
      await userRepo.update(userId, {
        currentLevel: suggestedLevel,
      })

      // 为新等级创建进度记录
      for (let level = 1; level <= suggestedLevel; level++) {
        const existing = await progressRepo.getLevelProgress(userId, level)
        if (!existing) {
          await progressRepo.createLevelProgress(userId, level)
        }
      }
    }

    return {
      assessmentId: assessment.id,
      score,
      correctCount,
      questionCount: ASSESSMENT_QUESTION_COUNT,
      suggestedLevel,
      confirmedLevel: assessment.confirmedLevel,
      message: this.getScoreMessage(score),
    }
  }

  /**
   * 根据分数计算推荐等级
   */
  private calculateSuggestedLevel(score: number): number {
    if (score >= 80) return 10
    if (score >= 60) return 5
    return 1
  }

  /**
   * 根据分数生成反馈信息
   */
  private getScoreMessage(score: number): string {
    if (score >= 90) return 'Excellent! You have a strong foundation.'
    if (score >= 70) return 'Good! You are ready to start learning.'
    if (score >= 50) return 'Fair. Keep practicing to improve.'
    return 'Keep working hard! You will improve soon.'
  }

  /**
   * 检查用户是否需要进行测评
   */
  async shouldUserTakeAssessment(userId: string): Promise<boolean> {
    const user = await userRepo.findById(userId)
    if (!user) throw new Error('User not found')

    // 如果用户当前等级是1，且没有进行过测评，则需要测评
    if (user.currentLevel === 1) {
      const hasAssessment = await assessmentRepo.hasUserTakenAssessment(userId)
      return !hasAssessment
    }

    return false
  }
}
```

---

## 3. API 路由

### 开始测评

**文件**: `app/api/v1/assessment/start/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { AssessmentService } from '@/lib/services/assessment.service'

const assessmentService = new AssessmentService()

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

    // 检查用户是否需要进行测评
    const shouldTake = await assessmentService.shouldUserTakeAssessment(
      payload.userId
    )

    if (!shouldTake) {
      return NextResponse.json(
        {
          code: 40001,
          message: 'User does not need to take assessment',
          data: null,
        },
        { status: 400 }
      )
    }

    // 生成测评题目
    const questions = await assessmentService.generateAssessmentQuestions()

    // 生成 assessment ID（用于后续提交）
    const assessmentId = `assessment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: {
        assessmentId,
        questions: questions.map((q) => ({
          id: q.id,
          enText: q.enText,
          zhText: q.zhText,
          audioUrl: q.audioUrl,
          options: q.options,
        })),
        questionCount: questions.length,
      },
    })
  } catch (error) {
    console.error('Start assessment error:', error)
    return NextResponse.json(
      { code: 50000, message: 'Internal server error', data: null },
      { status: 500 }
    )
  }
}
```

### 提交测评

**文件**: `app/api/v1/assessment/submit/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/utils/jwt'
import { AssessmentService } from '@/lib/services/assessment.service'

const assessmentService = new AssessmentService()

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
    const { answers } = body

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { code: 40001, message: 'Invalid answers format', data: null },
        { status: 400 }
      )
    }

    const result = await assessmentService.submitAssessment(
      payload.userId,
      answers
    )

    return NextResponse.json({
      code: 0,
      message: 'ok',
      data: result,
    })
  } catch (error: any) {
    console.error('Submit assessment error:', error)

    if (error.message.includes('Expected')) {
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

## 4. 使用示例

### 开始测评

```bash
curl -X POST http://localhost:3000/api/v1/assessment/start \
  -H "Authorization: Bearer <token>"
```

### 响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "assessmentId": "assessment-1234567890-abc123",
    "questions": [
      {
        "id": "sent-001",
        "enText": "Hello, how are you?",
        "zhText": "你好，你好吗？",
        "audioUrl": "https://example.com/audio/001.mp3",
        "options": ["你好，你好吗？", "再见", "谢谢", "对不起"]
      }
    ],
    "questionCount": 20
  }
}
```

### 提交测评

```bash
curl -X POST http://localhost:3000/api/v1/assessment/submit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "questionId": "sent-001",
        "selectedAnswer": "你好，你好吗？"
      },
      {
        "questionId": "sent-002",
        "selectedAnswer": "再见"
      }
    ]
  }'
```

### 响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "assessmentId": "assessment-1234567890-abc123",
    "score": 85,
    "correctCount": 17,
    "questionCount": 20,
    "suggestedLevel": 10,
    "confirmedLevel": 10,
    "message": "Excellent! You have a strong foundation."
  }
}
```

---

## 5. 测评规则

### 题目生成
- 从1-2级的句子中随机抽取20题
- 每题包含1个正确答案 + 3个干扰项
- 选项顺序随机打乱

### 分数计算
- 百分制（0-100）
- 公式：`(正确数 / 20) * 100`

### 等级推荐
| 分数范围 | 推荐等级 |
|---------|--------|
| 0-40 | 1 |
| 41-70 | 5 |
| 71-100 | 10 |

### 用户等级更新
- 仅在首次测评时更新用户等级
- 为推荐等级之前的所有等级创建进度记录
- 用户可以从推荐等级开始学习

