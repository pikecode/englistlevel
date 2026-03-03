import React, { createContext, useContext, useState, useCallback } from 'react'
import { saveLearningState, getLearningState } from '../utils/storage'

interface LearningState {
  currentLevel: number
  sentences: any[]
  progress: {
    completedCount: number
    masteredCount: number
    totalSentences: number
  }
  selectedMastery: { [key: string]: number }
}

interface LearningContextType {
  state: LearningState | null
  setState: (state: LearningState) => void
  updateMastery: (sentenceId: string, score: number) => void
  clearState: () => void
}

const LearningContext = createContext<LearningContextType | undefined>(undefined)

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateInternal] = useState<LearningState | null>(() => {
    return getLearningState()
  })

  const setState = useCallback((newState: LearningState) => {
    saveLearningState(newState)
    setStateInternal(newState)
  }, [])

  const updateMastery = useCallback(
    (sentenceId: string, score: number) => {
      if (!state) return

      const newState = {
        ...state,
        selectedMastery: {
          ...state.selectedMastery,
          [sentenceId]: score,
        },
      }
      setState(newState)
    },
    [state, setState]
  )

  const clearState = useCallback(() => {
    saveLearningState(null)
    setStateInternal(null)
  }, [])

  return (
    <LearningContext.Provider
      value={{
        state,
        setState,
        updateMastery,
        clearState,
      }}
    >
      {children}
    </LearningContext.Provider>
  )
}

export function useLearning() {
  const context = useContext(LearningContext)
  if (!context) {
    throw new Error('useLearning must be used within LearningProvider')
  }
  return context
}
