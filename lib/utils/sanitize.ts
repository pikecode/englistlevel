import { NextRequest, NextResponse } from 'next/server'

/**
 * 输入清理工具
 */

/**
 * 清理 HTML 标签
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * 清理 SQL 注入
 */
export function sanitizeSql(input: string): string {
  return input.replace(/['";\\]/g, '\\$&')
}

/**
 * 验证邮箱
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证 URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 验证 JSON
 */
export function isValidJson(json: string): boolean {
  try {
    JSON.parse(json)
    return true
  } catch {
    return false
  }
}

/**
 * 限制字符串长度
 */
export function limitLength(input: string, maxLength: number): string {
  return input.substring(0, maxLength)
}

/**
 * 移除危险字符
 */
export function removeDangerousChars(input: string): string {
  return input.replace(/[<>\"'%;()&+]/g, '')
}
