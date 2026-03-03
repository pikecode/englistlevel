# 英语PK小程序 MVP 设计方案

**日期**: 2026-03-03
**范围**: 学习+升级系统
**技术栈**: Node.js + Next.js + PostgreSQL + 微信小程序
**部署**: 自建服务器/云服务商

---

## 1. MVP 范围

### 核心功能
- 用户微信登录与认证
- 首次进入快速测评（确定初始等级）
- 单人学习模式（展示当前等级20句）
- 学习进度记录与自动升级
- 用户主页展示（当前等级、学习进度）

### 不包含（后续迭代）
- PK对战、积分系统、商城、支付、会员、后台管理

---

## 2. 架构设计

### 2.1 整体架构

```
微信小程序
    ↓
Next.js API Routes (/api/v1/*)
    ↓
业务层（Services）
├── AuthService（认证）
├── UserService（用户管理）
├── LearningService（学习逻辑）
├── AssessmentService（测评）
└── ProgressService（进度追踪）
    ↓
数据访问层（Repositories）
├── UserRepository
├── SentenceRepository
├── ProgressRepository
└── AssessmentRepository
    ↓
PostgreSQL
```

### 2.2 分层说明

**API 层** (`/api/v1/*`)
- 处理HTTP请求/响应
- 参数验证
- 错误处理

**业务层** (`/lib/services/*`)
- 核心业务逻辑
- 事务管理
- 数据一致性保证

**数据访问层** (`/lib/repositories/*`)
- 数据库操作
- 查询优化
- 缓存策略

---

## 3. 数据库设计

### 3.1 核心表结构

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY,
  openid VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(255),
  avatar_url TEXT,
  current_level INT DEFAULT 1,
  vip_status VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 句子表
CREATE TABLE sentences (
  id UUID PRIMARY KEY,
  level INT NOT NULL,
  seq_no INT NOT NULL,
  en_text TEXT NOT NULL,
  zh_text TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(level, seq_no)
);

-- 用户学习进度表
CREATE TABLE user_progress (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  level INT NOT NULL,
  completed_count INT DEFAULT 0,
  mastered_count INT DEFAULT 0,
  is_passed BOOLEAN DEFAULT FALSE,
  passed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, level)
);

-- 用户句子掌握度表
CREATE TABLE user_sentence_mastery (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  sentence_id UUID NOT NULL REFERENCES sentences(id),
  mastery_score INT DEFAULT 0,
  last_practiced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, sentence_id)
);

-- 测评记录表
CREATE TABLE assessments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  score INT NOT NULL,
  question_count INT DEFAULT 20,
  correct_count INT NOT NULL,
  suggested_level INT NOT NULL,
  confirmed_level INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 索引策略

```sql
CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_sentences_level ON sentences(level);
CREATE INDEX idx_user_progress_user_level ON user_progress(user_id, level);
CREATE INDEX idx_user_mastery_user ON user_sentence_mastery(user_id);
```

---

## 4. API 设计

### 4.1 认证接口

```
POST /api/v1/auth/wx-login
请求: { code: string }
响应: { token: string, user_id: string, is_new_user: boolean }
```

### 4.2 用户接口

```
GET /api/v1/user/profile
响应: {
  user_id, nickname, avatar_url, current_level,
  completed_levels, total_mastered_sentences
}
```

### 4.3 学习接口

```
GET /api/v1/learning/current-level
响应: {
  level, sentences: [{ id, en_text, zh_text, audio_url }],
  progress: { completed: 5, total: 20 }
}

POST /api/v1/learning/progress
请求: { sentence_id: string, is_completed: boolean, mastery_score: 0-100 }
响应: { success: boolean }

POST /api/v1/learning/complete-level
响应: {
  old_level: 1, new_level: 2, upgraded: true,
  next_level_sentences: [...]
}
```

### 4.4 测评接口

```
POST /api/v1/assessment/start
响应: {
  assessment_id,
  questions: [{ id, en_text, zh_text, options: [...] }]
}

POST /api/v1/assessment/submit
请求: { assessment_id, answers: [{ question_id, answer }] }
响应: {
  score, suggested_level, confirmed_level,
  user_level_updated: true
}
```

---

## 5. 核心业务流程

### 5.1 首次登录流程
```
用户登录 → 微信code换token → 创建用户 → 触发测评 →
根据测评结果设置初始等级 → 返回用户信息
```

### 5.2 学习流程
```
进入学习页 → 获取当前等级20句 → 用户学习 →
上报进度 → 判定是否完成本级 →
完成则升级 → 更新user.current_level
```

### 5.3 升级判定规则
```
当 user_progress.completed_count >= 20 时：
  - 升级：user.current_level += 1
  - 创建新等级的 user_progress 记录
  - 返回升级成功
```

---

## 6. 项目结构

```
englistlevel/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── auth/
│   │       ├── user/
│   │       ├── learning/
│   │       └── assessment/
│   └── page.tsx
├── lib/
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── learning.service.ts
│   │   ├── assessment.service.ts
│   │   └── progress.service.ts
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   ├── sentence.repository.ts
│   │   ├── progress.repository.ts
│   │   └── assessment.repository.ts
│   ├── db/
│   │   ├── client.ts
│   │   └── migrations/
│   └── utils/
│       ├── jwt.ts
│       ├── errors.ts
│       └── validators.ts
├── prisma/
│   └── schema.prisma
├── docs/
│   ├── plans/
│   └── ...
└── package.json
```

---

## 7. 技术选型

| 层级 | 技术 | 原因 |
|------|------|------|
| 后端框架 | Next.js | 全栈开发，API Routes简洁 |
| 数据库 | PostgreSQL | 关系型，支持复杂查询 |
| ORM | Prisma | 类型安全，开发效率高 |
| 认证 | JWT | 无状态，适合小程序 |
| 前端 | 微信小程序原生 | 官方支持，性能好 |

---

## 8. 开发阶段

### Phase 1: 基础框架（1-2天）
- [ ] 项目初始化（Next.js + Prisma）
- [ ] 数据库设计与迁移
- [ ] 认证服务（微信登录）
- [ ] 基础API框架

### Phase 2: 核心功能（2-3天）
- [ ] 用户服务
- [ ] 学习服务（获取句子、记录进度）
- [ ] 升级逻辑
- [ ] 测评服务

### Phase 3: 小程序集成（1-2天）
- [ ] 小程序登录页
- [ ] 学习页面
- [ ] 用户主页
- [ ] 测评页面

### Phase 4: 测试与优化（1天）
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能优化
- [ ] 部署准备

---

## 9. 成功指标

- ✅ 用户能完成微信登录
- ✅ 首次登录自动进行测评
- ✅ 用户能查看当前等级的20句
- ✅ 学习进度能正确记录
- ✅ 完成20句后自动升级
- ✅ 升级后能看到新等级的内容

---

## 10. 数据初始化

### MVP 示例数据
- 100句示例数据（5个等级，每级20句）
- 提供 CSV 导入脚本
- 用户可后续导入完整的5000句数据

### 导入脚本
```bash
npm run seed:sentences -- --file sentences.csv
```

---

## 11. 待确认项

- [ ] 微信小程序 AppID 和 AppSecret
- [ ] 部署服务器信息（IP、域名）
- [ ] 数据库连接信息
- [ ] 是否需要 Redis 缓存
- [ ] 是否需要 CDN 加速音频文件

