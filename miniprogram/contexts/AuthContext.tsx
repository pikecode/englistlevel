import React, { createContext, useContext, useState, useCallback } from 'react'
import { saveToken, saveUserId, saveUserInfo, clearAll } from '../utils/storage'

interface User {
  id: string
  nickname: string
  avatarUrl?: string
  currentLevel: number
  vipStatus: string
}

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  login: (token: string, userId: string, user: User) => void
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = useCallback((token: string, userId: string, userData: User) => {
    saveToken(token)
    saveUserId(userId)
    saveUserInfo(userData)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    clearAll()
    setUser(null)
  }, [])

  const updateUser = useCallback((userData: User) => {
    saveUserInfo(userData)
    setUser(userData)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
