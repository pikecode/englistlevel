/**
 * 参数验证工具
 */

export interface ValidationRule {
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object'
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

export class ValidationError extends Error {
  constructor(public field: string, public message: string) {
    super(`${field}: ${message}`)
    this.name = 'ValidationError'
  }
}

/**
 * 验证单个字段
 */
export function validateField(value: any, rule: ValidationRule, fieldName: string): void {
  // 检查必填
  if (rule.required && (value === undefined || value === null || value === '')) {
    throw new ValidationError(fieldName, 'is required')
  }

  if (value === undefined || value === null) {
    return
  }

  // 检查类型
  if (rule.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value
    if (actualType !== rule.type) {
      throw new ValidationError(fieldName, `must be ${rule.type}, got ${actualType}`)
    }
  }

  // 检查字符串长度
  if (typeof value === 'string') {
    if (rule.min !== undefined && value.length < rule.min) {
      throw new ValidationError(fieldName, `must be at least ${rule.min} characters`)
    }
    if (rule.max !== undefined && value.length > rule.max) {
      throw new ValidationError(fieldName, `must be at most ${rule.max} characters`)
    }
  }

  // 检查数字范围
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      throw new ValidationError(fieldName, `must be at least ${rule.min}`)
    }
    if (rule.max !== undefined && value > rule.max) {
      throw new ValidationError(fieldName, `must be at most ${rule.max}`)
    }
  }

  // 检查正则表达式
  if (rule.pattern && typeof value === 'string') {
    if (!rule.pattern.test(value)) {
      throw new ValidationError(fieldName, `does not match pattern ${rule.pattern}`)
    }
  }

  // 自定义验证
  if (rule.custom) {
    const result = rule.custom(value)
    if (result !== true) {
      const message = typeof result === 'string' ? result : 'validation failed'
      throw new ValidationError(fieldName, message)
    }
  }
}

/**
 * 验证对象
 */
export function validate(data: any, schema: ValidationSchema): void {
  for (const [field, rule] of Object.entries(schema)) {
    validateField(data[field], rule, field)
  }
}

/**
 * 常见验证规则
 */
export const CommonRules = {
  email: {
    type: 'string' as const,
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },

  password: {
    type: 'string' as const,
    required: true,
    min: 6,
    max: 128,
  },

  username: {
    type: 'string' as const,
    required: true,
    min: 2,
    max: 32,
    pattern: /^[a-zA-Z0-9_-]+$/,
  },

  url: {
    type: 'string' as const,
    required: true,
    pattern: /^https?:\/\/.+/,
  },

  positiveNumber: {
    type: 'number' as const,
    required: true,
    min: 0,
  },

  masteryScore: {
    type: 'number' as const,
    required: true,
    min: 0,
    max: 100,
  },
}
