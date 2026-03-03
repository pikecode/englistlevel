# 监控和告警指南

## 日志系统

### 日志级别

- **ERROR**: 错误信息，需要立即处理
- **WARN**: 警告信息，需要关注
- **INFO**: 信息日志，记录重要事件
- **DEBUG**: 调试信息，仅在开发环境使用

### 日志文件

- **error.log**: 错误日志
- **combined.log**: 所有日志

### 日志配置

```typescript
import logger from '@/lib/utils/logger'

logger.info('User logged in', { userId: '123' })
logger.error('Database connection failed', error)
logger.warn('High memory usage detected')
```

## 性能监控

### 记录性能指标

```typescript
import { recordMetric, getMetricsStats } from '@/lib/utils/performance'

const startTime = Date.now()
// ... 执行操作
const duration = Date.now() - startTime
recordMetric('operation-name', duration)

// 获取统计
const stats = getMetricsStats()
console.log(stats)
```

### 性能装饰器

```typescript
import { withPerformanceMonitoring } from '@/lib/utils/performance'

class UserService {
  @withPerformanceMonitoring('getUserProfile')
  async getUserProfile(userId: string) {
    // ...
  }
}
```

## 错误告警

### 记录告警

```typescript
import { recordAlert, onAlert } from '@/lib/utils/alerts'

recordAlert('Database connection failed', 'critical', { error: err })

// 注册告警处理器
onAlert((alert) => {
  if (alert.severity === 'critical') {
    // 发送通知
    sendNotification(alert)
  }
})
```

### 告警级别

- **LOW**: 低优先级，可以稍后处理
- **MEDIUM**: 中等优先级，需要关注
- **HIGH**: 高优先级，需要立即处理
- **CRITICAL**: 关键，需要立即采取行动

## 监控指标

### 关键指标

- **API 响应时间**: P95 < 300ms
- **数据库查询时间**: P95 < 100ms
- **错误率**: < 0.1%
- **可用性**: >= 99.9%

### 监控仪表板

建议使用以下工具进行监控：

- **Prometheus**: 指标收集
- **Grafana**: 可视化仪表板
- **ELK Stack**: 日志分析
- **Sentry**: 错误追踪

## 告警规则

### 自动告警

- 错误率 > 1%
- API 响应时间 > 1000ms
- 数据库连接失败
- 内存使用率 > 80%
- CPU 使用率 > 90%

### 手动告警

```typescript
// 在关键操作中手动记录告警
if (errorCount > threshold) {
  recordAlert('High error rate detected', 'high', { errorCount })
}
```

## 故障排查

### 查看日志

```bash
# 查看最近的错误
tail -f logs/error.log

# 搜索特定错误
grep "error message" logs/combined.log

# 查看性能指标
curl http://localhost:3000/api/v1/admin/metrics
```

### 性能分析

```bash
# 使用 Node.js 性能分析工具
node --prof app.js
node --prof-process isolate-*.log > profile.txt
```

## 最佳实践

1. **定期检查日志**: 每天检查错误日志
2. **设置告警阈值**: 根据实际情况调整
3. **保留日志**: 至少保留 30 天的日志
4. **监控关键指标**: 关注 API 响应时间和错误率
5. **定期备份**: 备份重要的日志文件
