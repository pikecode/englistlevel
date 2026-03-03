import React, { useState, useEffect } from 'react'
import { getGlobalRanking } from '../utils/api'
import { Card } from '../components/Card'
import styles from './RankingPage.module.css'

export function RankingPage() {
  const [ranking, setRanking] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRanking()
  }, [])

  const loadRanking = async () => {
    try {
      const data = await getGlobalRanking()
      setRanking(data)
    } catch (error) {
      console.error('Load ranking error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className={styles.container}>加载中...</div>
  }

  if (!ranking) {
    return <div className={styles.container}>无数据</div>
  }

  return (
    <div className={styles.container}>
      {/* 我的排名 */}
      <Card className={styles.myRank}>
        <div className={styles.rankInfo}>
          <span className={styles.rankLabel}>我的排名</span>
          <span className={styles.rankValue}>第 {ranking.myRank} 名</span>
        </div>
        <div className={styles.rankInfo}>
          <span className={styles.rankLabel}>总人数</span>
          <span className={styles.rankValue}>{ranking.totalUsers}</span>
        </div>
      </Card>

      {/* 排行榜列表 */}
      <div className={styles.list}>
        {ranking.topUsers.map((user: any) => (
          <Card key={user.id} className={styles.rankItem}>
            <div className={styles.rankNumber}>
              {user.rank <= 3 ? (
                <span className={styles.medal}>
                  {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
                </span>
              ) : (
                <span className={styles.number}>{user.rank}</span>
              )}
            </div>
            <img
              src={user.avatarUrl || '/default-avatar.png'}
              alt={user.nickname}
              className={styles.avatar}
            />
            <div className={styles.userInfo}>
              <p className={styles.nickname}>{user.nickname}</p>
              <p className={styles.level}>第 {user.currentLevel} 级</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
