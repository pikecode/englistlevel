import React from 'react'
import styles from './Button.module.css'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  size?: 'small' | 'medium' | 'large'
}

export function Button({
  children,
  onClick,
  type = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  size = 'medium',
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[type]} ${styles[size]} ${fullWidth ? styles.fullWidth : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? '加载中...' : children}
    </button>
  )
}
