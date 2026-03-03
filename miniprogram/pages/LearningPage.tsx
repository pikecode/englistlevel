import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLearning } from '../contexts/LearningContext'
import { getCurrentLevelContent, recordProgress, completeLevel } from '../utils/api'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Progress } from '../components/Progress'
import { Modal } from '../components/Modal'
import styles from './LearningPage.module.css'

export function LearningPage() {
  useAuth()
  const { state, setState, updateMastery } = useLearning()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadLevelContent()
  }, [])

  const loadLevelContent = async () => {
    setLoading(true)
    setError('')

    try {
      const content = await getCurrentLevelContent()
      setState({
        currentLevel: content.level,
        sentences: content.sentences,
        progress: content.progress,
        selectedMastery: {},
      })
    } catch (err: any) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectMastery = async (sentenceId: string, score: number) => {
    updateMastery(sentenceId, score)

    try {
      await recordProgress(sentenceId, score)
    } catch (err: any) {
      console.error('Save progress error:', err)
    }
  }

  const handleCompleteLevel = async () => {
    if (!state || state.progress.completedCount < state.progress.totalSentences) {
      setError('请完成所有句子')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const result = await completeLevel()

      // 显示成功提示
      alert(result.message)

      // 加载下一级
      setTimeout(() => {
        loadLevelContent()
        setShowCompleteModal(false)
      }, 1000)
    } catch (err: any) {
      setError(err.message || '升级失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className={styles.container}>加载中...</div>
  }

  if (!state) {
    return <div className={styles.container}>无数据</div>
  }

  return (
    <div className={styles.container}>
      {/* 顶部进度条 */}
      <div className={styles.header}>
        <div className={styles.levelInfo}>
          <span className={styles.levelLabel}>第 {state.currentLevel} 级</span>
          <span className={styles.progressText}>
            {state.progress.completedCount}/{state.progress.totalSentences}
          </span>
        </div>
        <Progress
          percent={(state.progress.completedCount / state.progress.totalSentences) * 100}
          showInfo={false}
        />
      </div>

      {/* 句子卡片 */}
      <div className={styles.content}>
        {state.sentences.map((sentence) => (
          <Card key={sentence.id} className={styles.sentenceCard}>
            <div className={styles.sentenceHeader}>
              <span className={styles.seqNo}>第 {sentence.seqNo} 句</span>
              <button
                className={styles.audioBtn}
                onClick={() => {
                  if (sentence.audioUrl) {
                    const audio = new Audio(sentence.audioUrl)
                    audio.play().catch(() => {
                      console.log('Audio play failed')
                    })
                  }
                }}
              >
                🔊 播放
              </button>
            </div>

            <div className={styles.sentenceContent}>
              <p className={styles.enText}>{sentence.enText}</p>
              <p className={styles.zhText}>{sentence.zhText}</p>
            </div>

            <div className={styles.masterySelector}>
              <label className={styles.label}>掌握程度：</label>
              <div className={styles.buttons}>
                {[
                  { score: 0, label: '未掌握' },
                  { score: 50, label: '部分掌握' },
                  { score: 100, label: '完全掌握' },
                ].map(({ score, label }) => (
                  <button
                    key={score}
                    className={`${styles.btn} ${
                      state.selectedMastery[sentence.id] === score ? styles.active : ''
                    }`}
                    onClick={() => handleSelectMastery(sentence.id, score)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 底部按钮 */}
      <div className={styles.footer}>
        {error && <div className={styles.error}>{error}</div>}
        <Button
          type="primary"
          fullWidth
          loading={submitting}
          onClick={() => setShowCompleteModal(true)}
          disabled={state.progress.completedCount < state.progress.totalSentences}
        >
          {state.progress.completedCount >= state.progress.totalSentences
            ? '完成本级'
            : '请完成所有句子'}
        </Button>
      </div>

      {/* 完成确认模态框 */}
      <Modal
        visible={showCompleteModal}
        title="完成本级"
        onConfirm={handleCompleteLevel}
        onCancel={() => setShowCompleteModal(false)}
        confirmText="确定"
        cancelText="取消"
      >
        <p>确定要完成第 {state.currentLevel} 级吗？</p>
        <p>完成后将自动升级到第 {state.currentLevel + 1} 级。</p>
      </Modal>
    </div>
  )
}
