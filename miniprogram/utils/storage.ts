/**
 * 本地存储工具
 */

/**
 * 保存 token
 */
export function saveToken(token: string): void {
  localStorage.setItem('token', token)
}

/**
 * 获取 token
 */
export function getToken(): string | null {
  return localStorage.getItem('token')
}

/**
 * 清除 token
 */
export function clearToken(): void {
  localStorage.removeItem('token')
}

/**
 * 保存用户 ID
 */
export function saveUserId(userId: string): void {
  localStorage.setItem('userId', userId)
}

/**
 * 获取用户 ID
 */
export function getUserId(): string | null {
  return localStorage.getItem('userId')
}

/**
 * 保存用户信息
 */
export function saveUserInfo(userInfo: any): void {
  localStorage.setItem('userInfo', JSON.stringify(userInfo))
}

/**
 * 获取用户信息
 */
export function getUserInfo(): any {
  const data = localStorage.getItem('userInfo')
  return data ? JSON.parse(data) : null
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  return !!getToken()
}

/**
 * 清除所有数据
 */
export function clearAll(): void {
  localStorage.clear()
}

/**
 * 保存学习状态
 */
export function saveLearningState(state: any): void {
  localStorage.setItem('learningState', JSON.stringify(state))
}

/**
 * 获取学习状态
 */
export function getLearningState(): any {
  const data = localStorage.getItem('learningState')
  return data ? JSON.parse(data) : null
}
