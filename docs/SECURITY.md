# 安全指南

## 认证和授权

### JWT Token

- Token 有效期：30 天
- 使用 HS256 算法
- 存储在 localStorage 中

### 密码安全

- 使用 bcryptjs 加密
- 最小长度：6 字符
- 不存储明文密码

## 输入验证

### 参数验证

所有 API 端点都进行参数验证：

```typescript
import { validate, CommonRules } from '@/lib/utils/validators'

const schema = {
  email: CommonRules.email,
  masteryScore: CommonRules.masteryScore,
}

validate(data, schema)
```

### 输入清理

```typescript
import { sanitizeHtml, sanitizeSql } from '@/lib/utils/sanitize'

const cleanInput = sanitizeHtml(userInput)
```

## 防护措施

### XSS 防护

- 所有用户输入都进行 HTML 转义
- 使用 Content Security Policy (CSP) 头
- 避免使用 `dangerouslySetInnerHTML`

### SQL 注入防护

- 使用 Prisma ORM（参数化查询）
- 不拼接 SQL 字符串
- 验证所有输入

### CSRF 防护

- 使用 CSRF token
- 验证 Origin 和 Referer 头
- 对 POST/PUT/DELETE 请求进行保护

## 数据安全

### 敏感数据

- 不在日志中记录密码
- 不在 URL 中传递敏感信息
- 使用 HTTPS 传输

### 数据库安全

- 使用强密码
- 限制数据库访问
- 定期备份
- 启用审计日志

## API 安全

### 速率限制

```typescript
import { withRateLimit } from '@/lib/middleware'

export const GET = withRateLimit(100, 60000)(handler)
```

### 错误处理

- 不暴露内部错误信息
- 返回通用错误消息
- 记录详细错误日志

## 依赖安全

- 定期运行 `npm audit`
- 及时更新依赖包
- 使用 npm 安全审计工具

## 部署安全

- 使用环境变量存储敏感信息
- 启用 HTTPS
- 配置防火墙
- 定期安全审计
