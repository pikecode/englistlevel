import React from 'react'
import styles from './Modal.module.css'
import { Button } from './Button'

interface ModalProps {
  visible: boolean
  title: string
  children: React.ReactNode
  onConfirm?: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
}

export function Modal({
  visible,
  title,
  children,
  onConfirm,
  onCancel,
  confirmText = '确定',
  cancelText = '取消',
}: ModalProps) {
  if (!visible) return null

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{title}</h2>
        </div>
        <div className={styles.content}>{children}</div>
        <div className={styles.footer}>
          {onCancel && (
            <Button type="secondary" onClick={onCancel}>
              {cancelText}
            </Button>
          )}
          {onConfirm && (
            <Button type="primary" onClick={onConfirm}>
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
