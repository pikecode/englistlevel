import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getUserStats, getLearningTrend } from '../utils/api'
import { Card } from '../components/Card'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [trend, setTrend] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [statsData, trendData] = await Promise.all([
        getUserStats(),
        getLearningTrend(7),
      ])
      setStats(statsData)
      setTrend(trendData)
    } catch (error) {
      console.error('Load stats error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className={styles.container}>加载中...</div>
  }

  return (
    <div className={styles.container}>
      {/* 用户信息 */}
      <div className={styles.header}>
        <img
          src={user?.avatarUrl || '/default-avatar.png'}
          alt="avatar"
          className={styles.avatar}
        />
        <div className={styles.info}>
          <h2 className={styles.nickname}>{user?.nickname}</h2>
          <p className={styles.level}>第 {user?.currentLevel} 级</p>
        </div>
      </div>

      {/* 统计数据 */}
      {stats && (
        <div className={styles.stats}>
          <Card className={styles.statItem}>
            <div className={styles.statValue}>{stats.completedLevels}</div>
            <div className={styles.statLabel}>已完成等级</div>
          </Card>
          <Card className={styles.statItem}>
            <div className={styles.statValue}>{stats.masteredSentences}</div>
            <div className={styles.statLabel}>已掌握句子</div>
          </Card>
          <Card className={styles.statItem}>
            <div className={styles.statValue}>{stats.totalPracticed}</div>
            <div className={styles.statLabel}>总学习句子</div>
          </Card>
          <Card className={styles.statItem}>
            <div className={styles.statValue}>{stats.learningDays}</div>
            <div className={styles.statLabel}>学习天数</div>
          </Card>
        </div>
      )}

      {/* 学习趋势 */}
      {trend && (
        <Card className={styles.trendCard}>
          <h3>最近7天学习趋势</h3>
          <div className={styles.trendChart}>
            {trend.trend.map((item: any) => (
              <div key={item.date} className={styles.trendBar}>
                <div
                  className={styles.bar}
                  style={{ height: `${Math.min(item.count * 10, 100)}px` }}
                />
                <span className={styles.date}>{item.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 操作按钮 */}
      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={() => (window.location.href = '/learning')}>
          继续学习
        </button>
        <button className={styles.actionBtn} onClick={() => (window.location.href = '/ranking')}>
          查看排行榜
        </button>
        <button className={`${styles.actionBtn} ${styles.danger}`} onClick={logout}>
          退出登录
        </button>
      </div>
    </div>
  )
}
