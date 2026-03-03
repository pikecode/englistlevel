# 英语PK小程序 MVP 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建学习+升级系统的MVP，用户能登录、学习句子、自动升级

**Architecture:** 分层单体架构，Next.js API + Prisma ORM + PostgreSQL，清晰的业务层分离

**Tech Stack:** Next.js 14, Prisma, PostgreSQL, TypeScript, JWT

---

## 总体任务分解

| 阶段 | 任务 | 预计时间 |
|------|------|--------|
| Phase 1 | 项目初始化 + 数据库设计 | 1-2h |
| Phase 2 | 认证服务 | 1-2h |
| Phase 3 | 用户与学习服务 | 2-3h |
| Phase 4 | 测评服务 | 1-2h |
| Phase 5 | API集成 | 1-2h |
| Phase 6 | 小程序集成 | 2-3h |

---

## Phase 1: 项目初始化

### Task 1.1: 初始化 Next.js 项目

**Files:**
- Create: `package.json`
- Create: `.env.local`
- Create: `tsconfig.json`

**Step 1: 初始化项目**

```bash
cd /Users/peakom/worko/englistlevel
npm create next-app@latest . --typescript --tailwind --eslint
```

**Step 2: 安装依赖**

```bash
npm install prisma @prisma/client jsonwebtoken bcryptjs dotenv
npm install -D @types/jsonwebtoken @types/bcryptjs
```

**Step 3: 创建 .env.local**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/englistlevel"
JWT_SECRET="your-secret-key-change-in-production"
NEXTAUTH_SECRET="your-nextauth-secret"
```

**Step 4: 验证项目结构**

```bash
ls -la
```

Expected: 看到 `app/`, `lib/`, `package.json` 等文件

---

### Task 1.2: 初始化 Prisma

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/.env`

**Step 1: 初始化 Prisma**

```bash
npx prisma init
```

**Step 2: 配置 schema.prisma**

见 `docs/plans/2026-03-03-database-schema.md`

**Step 3: 创建迁移**

```bash
npx prisma migrate dev --name init
```

**Step 4: 验证数据库**

```bash
npx prisma studio
```

Expected: 能打开 Prisma Studio，看到所有表

---

## Phase 2: 认证服务

### Task 2.1: JWT 工具函数

**Files:**
- Create: `lib/utils/jwt.ts`

**Step 1: 编写 JWT 工具**

见 `docs/plans/2026-03-03-auth-service.md`

**Step 2: 编写测试**

```bash
npm test -- lib/utils/jwt.test.ts
```

---

### Task 2.2: 微信登录 API

**Files:**
- Create: `app/api/v1/auth/wx-login/route.ts`
- Create: `lib/services/auth.service.ts`

**Step 1: 编写认证服务**

见 `docs/plans/2026-03-03-auth-service.md`

**Step 2: 编写 API 路由**

见 `docs/plans/2026-03-03-auth-service.md`

**Step 3: 测试**

```bash
curl -X POST http://localhost:3000/api/v1/auth/wx-login \
  -H "Content-Type: application/json" \
  -d '{"code":"test-code"}'
```

---

## Phase 3: 用户与学习服务

### Task 3.1: 用户服务

**Files:**
- Create: `lib/services/user.service.ts`
- Create: `lib/repositories/user.repository.ts`

**Step 1: 编写用户 Repository**

见 `docs/plans/2026-03-03-user-service.md`

**Step 2: 编写用户 Service**

见 `docs/plans/2026-03-03-user-service.md`

**Step 3: 编写 API 路由**

```bash
app/api/v1/user/profile/route.ts
```

---

### Task 3.2: 学习服务

**Files:**
- Create: `lib/services/learning.service.ts`
- Create: `lib/repositories/sentence.repository.ts`
- Create: `lib/repositories/progress.repository.ts`

**Step 1: 编写学习 Service**

见 `docs/plans/2026-03-03-learning-service.md`

**Step 2: 编写 API 路由**

```bash
app/api/v1/learning/current-level/route.ts
app/api/v1/learning/progress/route.ts
app/api/v1/learning/complete-level/route.ts
```

---

## Phase 4: 测评服务

### Task 4.1: 测评服务

**Files:**
- Create: `lib/services/assessment.service.ts`
- Create: `lib/repositories/assessment.repository.ts`

**Step 1: 编写测评 Service**

见 `docs/plans/2026-03-03-assessment-service.md`

**Step 2: 编写 API 路由**

```bash
app/api/v1/assessment/start/route.ts
app/api/v1/assessment/submit/route.ts
```

---

## Phase 5: 数据初始化

### Task 5.1: 种子数据脚本

**Files:**
- Create: `prisma/seed.ts`
- Create: `scripts/import-sentences.ts`

**Step 1: 编写种子脚本**

见 `docs/plans/2026-03-03-seed-data.md`

**Step 2: 运行种子脚本**

```bash
npx prisma db seed
```

---

## Phase 6: 小程序集成

### Task 6.1: 小程序登录页

**Files:**
- Create: `miniprogram/pages/login/login.wxml`
- Create: `miniprogram/pages/login/login.ts`

**Step 1: 编写登录页**

见 `docs/plans/2026-03-03-miniprogram.md`

---

### Task 6.2: 小程序学习页

**Files:**
- Create: `miniprogram/pages/learning/learning.wxml`
- Create: `miniprogram/pages/learning/learning.ts`

**Step 1: 编写学习页**

见 `docs/plans/2026-03-03-miniprogram.md`

---

## 下一步

详细的实现步骤分别在以下文档中：

1. **数据库设计**: `docs/plans/2026-03-03-database-schema.md`
2. **认证服务**: `docs/plans/2026-03-03-auth-service.md`
3. **用户服务**: `docs/plans/2026-03-03-user-service.md`
4. **学习服务**: `docs/plans/2026-03-03-learning-service.md`
5. **测评服务**: `docs/plans/2026-03-03-assessment-service.md`
6. **种子数据**: `docs/plans/2026-03-03-seed-data.md`
7. **小程序**: `docs/plans/2026-03-03-miniprogram.md`

