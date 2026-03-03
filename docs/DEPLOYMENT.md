# 部署指南

## 前置要求

- Node.js 18+
- PostgreSQL 13+
- Docker & Docker Compose（可选）

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/englistlevel"
JWT_SECRET="your-secret-key-here"
NEXTAUTH_SECRET="your-nextauth-secret"
```

### 3. 初始化数据库

```bash
npx prisma migrate dev --name init
npm run seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## Docker 部署

### 1. 构建镜像

```bash
docker build -t englistlevel:latest .
```

### 2. 使用 Docker Compose

```bash
docker-compose up -d
```

### 3. 初始化数据库

```bash
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run seed
```

## 生产部署

### 1. 构建应用

```bash
npm run build
```

### 2. 启动应用

```bash
npm start
```

### 3. 环境变量

设置以下环境变量：

- `DATABASE_URL` - PostgreSQL 连接字符串
- `JWT_SECRET` - JWT 密钥
- `NODE_ENV` - 设置为 `production`

### 4. 性能优化

- 启用 gzip 压缩
- 配置 CDN 加速
- 使用 Redis 缓存
- 配置数据库连接池

## 监控和日志

### 日志文件

- 应用日志：`/var/log/englistlevel/app.log`
- 错误日志：`/var/log/englistlevel/error.log`

### 监控指标

- CPU 使用率
- 内存使用率
- 数据库连接数
- API 响应时间

## 故障排查

### 数据库连接失败

检查 `DATABASE_URL` 是否正确，以及 PostgreSQL 服务是否运行。

### 应用启动失败

查看日志文件，检查是否有缺失的环境变量或依赖。

### 性能问题

- 检查数据库查询是否有 N+1 问题
- 启用缓存
- 增加服务器资源

## 备份和恢复

### 备份数据库

```bash
pg_dump englistlevel > backup.sql
```

### 恢复数据库

```bash
psql englistlevel < backup.sql
```

## 安全建议

- 定期更新依赖包
- 使用强密码
- 启用 HTTPS
- 配置防火墙
- 定期备份数据
- 监控异常活动
