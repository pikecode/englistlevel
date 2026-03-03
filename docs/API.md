# API 文档

## 基础信息

- **Base URL**: `/api/v1`
- **认证**: Bearer Token (JWT)
- **响应格式**: JSON
- **时间格式**: ISO8601 (UTC+8)

## 响应格式

所有 API 响应都遵循以下格式：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

### 错误响应

```json
{
  "code": 40001,
  "message": "Invalid parameters",
  "data": null
}
```

## 错误码

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-----------|
| 0 | 成功 | 200 |
| 40001 | 参数错误 | 400 |
| 40003 | 认证失败 | 401 |
| 40009 | 权限不足 | 403 |
| 41001 | 豆豆余额不足 | 400 |
| 41002 | 等级不匹配 | 400 |
| 42001 | 订单状态非法 | 400 |
| 42002 | 幂等冲突 | 409 |
| 50000 | 服务器错误 | 500 |

## 认证

### 微信登录

```
POST /auth/wx-login
Content-Type: application/json

{
  "code": "string"
}
```

**响应**:
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "string",
    "userId": "string",
    "isNewUser": true,
    "user": {
      "nickname": "string",
      "avatarUrl": "string",
      "currentLevel": 1
    }
  }
}
```

## 用户接口

### 获取用户信息

```
GET /user/profile
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "string",
    "openid": "string",
    "nickname": "string",
    "avatarUrl": "string",
    "currentLevel": 1,
    "vipStatus": "free",
    "createdAt": "2026-03-03T10:00:00Z",
    "stats": {
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

```
PATCH /user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "nickname": "string",
  "avatarUrl": "string"
}
```

## 学习接口

### 获取当前等级内容

```
GET /learning/current-level
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "level": 1,
    "sentences": [
      {
        "id": "string",
        "enText": "string",
        "zhText": "string",
        "audioUrl": "string",
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

```
POST /learning/progress
Authorization: Bearer <token>
Content-Type: application/json

{
  "sentenceId": "string",
  "masteryScore": 85
}
```

### 完成等级

```
POST /learning/complete-level
Authorization: Bearer <token>
```

**响应**:
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

## 测评接口

### 开始测评

```
POST /assessment/start
Authorization: Bearer <token>
```

**响应**:
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "assessmentId": "string",
    "questions": [
      {
        "id": "string",
        "enText": "string",
        "zhText": "string",
        "audioUrl": "string",
        "options": ["string"]
      }
    ],
    "questionCount": 20
  }
}
```

### 提交测评

```
POST /assessment/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "answers": [
    {
      "questionId": "string",
      "selectedAnswer": "string"
    }
  ]
}
```

## 排行榜接口

### 全局排行榜

```
GET /ranking/global
Authorization: Bearer <token>
```

### 等级排行榜

```
GET /ranking/level?level=1
Authorization: Bearer <token>
```

## 统计接口

### 用户统计

```
GET /stats/user
Authorization: Bearer <token>
```

### 学习趋势

```
GET /stats/trend?days=7
Authorization: Bearer <token>
```

### 系统概览

```
GET /stats/overview
Authorization: Bearer <token>
```

## 管理员接口

### 管理员登录

```
POST /admin/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

### 获取句子列表

```
GET /admin/content/sentences?page=1&pageSize=20&level=1
Authorization: Bearer <admin_token>
```

### 创建句子

```
POST /admin/content/sentences
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "level": 1,
  "seqNo": 1,
  "enText": "string",
  "zhText": "string",
  "audioUrl": "string"
}
```

### 批量导入句子

```
POST /admin/content/import
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "sentences": [
    {
      "level": 1,
      "seqNo": 1,
      "enText": "string",
      "zhText": "string",
      "audioUrl": "string"
    }
  ]
}
```

### 数据看板概览

```
GET /admin/dashboard/overview
Authorization: Bearer <admin_token>
```

### 用户统计

```
GET /admin/dashboard/users?days=7
Authorization: Bearer <admin_token>
```

### 学习统计

```
GET /admin/dashboard/learning?days=7
Authorization: Bearer <admin_token>
```
