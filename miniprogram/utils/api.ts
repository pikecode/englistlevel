// 后端 API 基础 URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/v1'

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

/**
 * 发送 HTTP 请求
 */
export function request<T>(
  method: 'GET' | 'POST' | 'PATCH',
  url: string,
  data?: any
): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token')

    const header: any = {
      'Content-Type': 'application/json',
    }

    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    const xhr = new XMLHttpRequest()
    xhr.open(method, `${API_BASE_URL}${url}`, true)

    Object.keys(header).forEach((key) => {
      xhr.setRequestHeader(key, header[key])
    })

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText) as ApiResponse<T>

        if (response.code === 0) {
          resolve(response.data)
        } else if (response.code === 40003) {
          // Token 过期
          localStorage.removeItem('token')
          localStorage.removeItem('userId')
          window.location.href = '/login'
          reject(new Error('Unauthorized'))
        } else {
          reject(new Error(response.message))
        }
      } catch (error) {
        reject(error)
      }
    }

    xhr.onerror = () => {
      reject(new Error('Network error'))
    }

    if (data) {
      xhr.send(JSON.stringify(data))
    } else {
      xhr.send()
    }
  })
}

/**
 * 微信登录
 */
export async function wxLogin(code: string): Promise<{
  token: string
  userId: string
  isNewUser: boolean
}> {
  return request('POST', '/auth/wx-login', { code })
}

/**
 * 获取用户信息
 */
export function getUserProfile(): Promise<any> {
  return request('GET', '/user/profile')
}

/**
 * 获取当前等级内容
 */
export function getCurrentLevelContent(): Promise<any> {
  return request('GET', '/learning/current-level')
}

/**
 * 记录学习进度
 */
export function recordProgress(sentenceId: string, masteryScore: number): Promise<any> {
  return request('POST', '/learning/progress', {
    sentenceId,
    masteryScore,
  })
}

/**
 * 完成等级
 */
export function completeLevel(): Promise<any> {
  return request('POST', '/learning/complete-level')
}

/**
 * 开始测评
 */
export function startAssessment(): Promise<any> {
  return request('POST', '/assessment/start')
}

/**
 * 提交测评
 */
export function submitAssessment(answers: any[]): Promise<any> {
  return request('POST', '/assessment/submit', { answers })
}

/**
 * 获取全局排行榜
 */
export function getGlobalRanking(): Promise<any> {
  return request('GET', '/ranking/global')
}

/**
 * 获取等级排行榜
 */
export function getLevelRanking(level: number): Promise<any> {
  return request('GET', `/ranking/level?level=${level}`)
}

/**
 * 获取用户统计
 */
export function getUserStats(): Promise<any> {
  return request('GET', '/stats/user')
}

/**
 * 获取学习趋势
 */
export function getLearningTrend(days: number = 7): Promise<any> {
  return request('GET', `/stats/trend?days=${days}`)
}

/**
 * 获取系统概览
 */
export function getOverviewStats(): Promise<any> {
  return request('GET', '/stats/overview')
}
