# 数据库设计详解

**文件**: `prisma/schema.prisma`

## Prisma Schema 完整代码

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ 用户域 ============

model User {
  id            String   @id @default(cuid())
  openid        String   @unique
  unionid       String?
  nickname      String?
  avatarUrl     String?
  currentLevel  Int      @default(1)
  vipStatus     String   @default("free") // free, active, expired
  status        String   @default("active") // active, banned
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  levelProgress      UserLevelProgress[]
  sentenceMastery    UserSentenceMastery[]
  assessments        Assessment[]
  peerReviews        PeerReview[]

  @@index([openid])
  @@index([currentLevel])
}

model UserLevelProgress {
  id                String   @id @default(cuid())
  userId            String
  level             Int
  totalSentences    Int      @default(20)
  completedCount    Int      @default(0)
  masteredCount     Int      @default(0)
  isPassed          Boolean  @default(false)
  passedAt          DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, level])
  @@index([userId])
}

model UserSentenceMastery {
  id               String   @id @default(cuid())
  userId           String
  sentenceId       String
  masteryScore     Int      @default(0) // 0-100
  lastPracticedAt  DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  sentence Sentence @relation(fields: [sentenceId], references: [id], onDelete: Cascade)

  @@unique([userId, sentenceId])
  @@index([userId])
}

// ============ 内容域 ============

model Sentence {
  id        String   @id @default(cuid())
  level     Int
  seqNo     Int      // 1-20 within a level
  enText    String
  zhText    String
  audioUrl  String?
  ttsEnabled Boolean @default(true)
  status    String   @default("active") // active, archived
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  userMastery UserSentenceMastery[]
  peerReviews PeerReview[]

  @@unique([level, seqNo])
  @@index([level])
}

// ============ 测评域 ============

model Assessment {
  id              String   @id @default(cuid())
  userId          String
  score           Int
  questionCount   Int      @default(20)
  correctCount    Int
  suggestedLevel  Int
  confirmedLevel  Int
  createdAt       DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model PeerReview {
  id              String   @id @default(cuid())
  reviewerUserId  String
  sentenceId      String
  score           Int      // 1-5
  comment         String?
  status          String   @default("pending") // pending, approved, rejected
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  reviewer User     @relation(fields: [reviewerUserId], references: [id], onDelete: Cascade)
  sentence Sentence @relation(fields: [sentenceId], references: [id], onDelete: Cascade)

  @@unique([reviewerUserId, sentenceId])
  @@index([reviewerUserId])
  @@index([sentenceId])
}
```

## 表结构说明

### users 表
- `id`: 主键（CUID）
- `openid`: 微信唯一标识（唯一索引）
- `currentLevel`: 当前等级（1-100）
- `vipStatus`: 会员状态
- `createdAt`, `updatedAt`: 时间戳

### user_level_progress 表
- 记录用户每个等级的学习进度
- `completedCount`: 已完成的句子数
- `masteredCount`: 已掌握的句子数
- 唯一约束：`(userId, level)`

### user_sentence_mastery 表
- 记录用户对每个句子的掌握度
- `masteryScore`: 0-100 分
- 唯一约束：`(userId, sentenceId)`

### sentences 表
- `level`: 等级（1-100）
- `seqNo`: 序号（1-20）
- 唯一约束：`(level, seqNo)`

### assessments 表
- 记录用户的测评记录
- `suggestedLevel`: 系统建议的等级
- `confirmedLevel`: 用户确认的等级

### peer_reviews 表
- 记录用户对句子的评分
- 唯一约束：`(reviewerUserId, sentenceId)`

## 迁移步骤

### Step 1: 创建 .env.local

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/englistlevel"
JWT_SECRET="your-secret-key-here"
```

### Step 2: 初始化 Prisma

```bash
npx prisma init
```

### Step 3: 复制 schema.prisma

将上面的 schema 复制到 `prisma/schema.prisma`

### Step 4: 创建迁移

```bash
npx prisma migrate dev --name init
```

### Step 5: 验证

```bash
npx prisma studio
```

## 索引策略

已在 schema 中定义的索引：

```
users:
  - openid (unique)
  - currentLevel

user_level_progress:
  - userId, level (unique)
  - userId

user_sentence_mastery:
  - userId, sentenceId (unique)
  - userId

sentences:
  - level, seqNo (unique)
  - level

assessments:
  - userId

peer_reviews:
  - reviewerUserId, sentenceId (unique)
  - reviewerUserId
  - sentenceId
```

## 关键约束

1. **级联删除**: 删除用户时，自动删除相关的进度、掌握度、测评记录
2. **唯一性**: 用户-等级、用户-句子、等级-序号都有唯一约束
3. **时间戳**: 所有表都有 `createdAt` 和 `updatedAt`

