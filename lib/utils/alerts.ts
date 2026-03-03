/**
 * 错误追踪和告警系统
 */

interface ErrorAlert {
  id: string
  message: string
  stack?: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  context?: any
}

const alerts: ErrorAlert[] = []
const alertHandlers: Array<(alert: ErrorAlert) => void> = []

/**
 * 记录错误告警
 */
export function recordAlert(
  message: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  context?: any,
  stack?: string
) {
  const alert: ErrorAlert = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    message,
    stack,
    timestamp: new Date(),
    severity,
    context,
  }

  alerts.push(alert)

  // 触发告警处理器
  alertHandlers.forEach((handler) => {
    try {
      handler(alert)
    } catch (error) {
      console.error('Error in alert handler:', error)
    }
  })

  // 关键告警立即输出
  if (severity === 'critical') {
    console.error(`[CRITICAL] ${message}`, context)
  }
}

/**
 * 注册告警处理器
 */
export function onAlert(handler: (alert: ErrorAlert) => void) {
  alertHandlers.push(handler)
}

/**
 * 获取告警列表
 */
export function getAlerts(severity?: string, limit: number = 100) {
  let filtered = alerts

  if (severity) {
    filtered = filtered.filter((a) => a.severity === severity)
  }

  return filtered.slice(-limit)
}

/**
 * 清除旧告警
 */
export function clearOldAlerts(maxAge: number = 86400000) {
  const now = Date.now()
  const cutoff = now - maxAge

  for (let i = alerts.length - 1; i >= 0; i--) {
    if (alerts[i].timestamp.getTime() < cutoff) {
      alerts.splice(i, 1)
    }
  }
}

/**
 * 获取告警统计
 */
export function getAlertStats() {
  const stats = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.filter((a) => a.severity === 'high').length,
    medium: alerts.filter((a) => a.severity === 'medium').length,
    low: alerts.filter((a) => a.severity === 'low').length,
  }

  return stats
}
