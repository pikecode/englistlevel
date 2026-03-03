/**
 * 性能监控工具
 */

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: Date
  status: 'success' | 'error'
  metadata?: any
}

const metrics: PerformanceMetric[] = []

/**
 * 记录性能指标
 */
export function recordMetric(
  name: string,
  duration: number,
  status: 'success' | 'error' = 'success',
  metadata?: any
) {
  metrics.push({
    name,
    duration,
    timestamp: new Date(),
    status,
    metadata,
  })

  // 如果超过阈值，记录警告
  if (duration > 1000) {
    console.warn(`Slow operation: ${name} took ${duration}ms`)
  }
}

/**
 * 获取性能统计
 */
export function getMetricsStats() {
  const stats: { [key: string]: any } = {}

  metrics.forEach((metric) => {
    if (!stats[metric.name]) {
      stats[metric.name] = {
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        avgDuration: 0,
        errorCount: 0,
      }
    }

    const stat = stats[metric.name]
    stat.count++
    stat.totalDuration += metric.duration
    stat.minDuration = Math.min(stat.minDuration, metric.duration)
    stat.maxDuration = Math.max(stat.maxDuration, metric.duration)
    stat.avgDuration = stat.totalDuration / stat.count

    if (metric.status === 'error') {
      stat.errorCount++
    }
  })

  return stats
}

/**
 * 清除旧指标
 */
export function clearOldMetrics(maxAge: number = 3600000) {
  const now = Date.now()
  const cutoff = now - maxAge

  for (let i = metrics.length - 1; i >= 0; i--) {
    if (metrics[i].timestamp.getTime() < cutoff) {
      metrics.splice(i, 1)
    }
  }
}

/**
 * 性能监控装饰器
 */
export function withPerformanceMonitoring(name: string) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()

      try {
        const result = await originalMethod.apply(this, args)
        const duration = Date.now() - startTime
        recordMetric(name, duration, 'success')
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        recordMetric(name, duration, 'error', { error: error instanceof Error ? error.message : String(error) })
        throw error
      }
    }

    return descriptor
  }
}
