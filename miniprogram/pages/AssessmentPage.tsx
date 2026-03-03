import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { startAssessment, submitAssessment } from '../utils/api'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Progress } from '../components/Progress'
import styles from './AssessmentPage.module.css'

export function AssessmentPage() {
  const { user, updateUser } = useAuth()
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    loadAssessment()
  }, [])

  const loadAssessment = async () => {
    try {
      const data = await startAssessment()
      setQuestions(data.questions)
      setAnswers(new Array(data.questions.length).fill(null))
    } catch (error) {
      console.error('Load assessment error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAnswer = (answer: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = {
      questionId: questions[currentQuestion].id,
      selectedAnswer: answer,
    }
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    try {
      const result = await submitAssessment(answers)
      setResult(result)

      // 更新用户信息
      if (user) {
        updateUser({
          ...user,
          currentLevel: result.confirmedLevel,
        })
      }
    } catch (error) {
      console.error('Submit assessment error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className={styles.container}>加载中...</div>
  }

  if (result) {
    return (
      <div className={styles.container}>
        <Card className={styles.resultCard}>
          <h2 className={styles.resultTitle}>测评完成</h2>
          <div className={styles.resultScore}>
            <span className={styles.score}>{result.score}</span>
            <span className={styles.label}>分</span>
          </div>
          <p className={styles.message}>{result.message}</p>
          <div className={styles.resultInfo}>
            <div>
              <span className={styles.label}>推荐等级</span>
              <span className={styles.value}>{result.suggestedLevel}</span>
            </div>
            <div>
              <span className={styles.label}>正确数</span>
              <span className={styles.value}>
                {result.correctCount}/{result.questionCount}
              </span>
            </div>
          </div>
          <Button
            type="primary"
            fullWidth
            onClick={() => (window.location.href = '/learning')}
          >
            开始学习
          </Button>
        </Card>
      </div>
    )
  }

  if (questions.length === 0) {
    return <div className={styles.container}>无题目</div>
  }

  const question = questions[currentQuestion]
  const selectedAnswer = answers[currentQuestion]?.selectedAnswer

  return (
    <div className={styles.container}>
      {/* 进度条 */}
      <div className={styles.header}>
        <span className={styles.progress}>
          {currentQuestion + 1}/{questions.length}
        </span>
        <Progress
          percent={((currentQuestion + 1) / questions.length) * 100}
          showInfo={false}
        />
      </div>

      {/* 题目 */}
      <Card className={styles.questionCard}>
        <h3 className={styles.questionText}>{question.enText}</h3>
        <div className={styles.options}>
          {question.options.map((option: string, index: number) => (
            <button
              key={index}
              className={`${styles.option} ${selectedAnswer === option ? styles.selected : ''}`}
              onClick={() => handleSelectAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </Card>

      {/* 导航按钮 */}
      <div className={styles.footer}>
        <Button
          type="secondary"
          onClick={handlePrev}
          disabled={currentQuestion === 0}
        >
          上一题
        </Button>
        {currentQuestion === questions.length - 1 ? (
          <Button
            type="primary"
            loading={submitting}
            onClick={handleSubmit}
            disabled={!selectedAnswer}
          >
            提交
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={handleNext}
            disabled={!selectedAnswer}
          >
            下一题
          </Button>
        )}
      </div>
    </div>
  )
}
