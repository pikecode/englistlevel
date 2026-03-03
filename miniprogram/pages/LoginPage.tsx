import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { wxLogin, getUserProfile } from '../utils/api'
import { saveToken, saveUserId } from '../utils/storage'
import { Button } from '../components/Button'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    try {
      // 模拟微信登录
      const mockCode = `mock-code-${Date.now()}`

      const result = await wxLogin(mockCode)

      // 获取用户信息
      const userProfile = await getUserProfile()

      // 保存登录信息
      login(result.token, result.userId, userProfile)

      // 重定向
      if (result.isNewUser) {
        window.location.href = '/assessment'
      } else {
        window.location.href = '/learning'
      }
    } catch (err: any) {
      setError(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>英语PK小程序</h1>
        <p className={styles.subtitle}>学习 · 对战 · 成长</p>
      </div>

      <div className={styles.content}>
        <div className={styles.logo}>📚</div>
        <p className={styles.welcome}>欢迎来到英语学习平台</p>
      </div>

      <div className={styles.footer}>
        {error && <div className={styles.error}>{error}</div>}
        <Button
          type="primary"
          fullWidth
          loading={loading}
          onClick={handleLogin}
        >
          微信登录
        </Button>
        <p className={styles.tips}>
          点击登录即表示同意《用户协议》和《隐私政策》
        </p>
      </div>
    </div>
  )
}
