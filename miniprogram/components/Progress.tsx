import React from 'react'
import styles from './Progress.module.css'

interface ProgressProps {
  percent: number
  showInfo?: boolean
  strokeWidth?: number
}

export function Progress({ percent, showInfo = true, strokeWidth = 4 }: ProgressProps) {
  const clampedPercent = Math.min(Math.max(percent, 0), 100)

  return (
    <div className={styles.container}>
      <div className={styles.bar} style={{ height: `${strokeWidth}px` }}>
        <div
          className={styles.fill}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
      {showInfo && <span className={styles.info}>{clampedPercent}%</span>}
    </div>
  )
}
