import React from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { LearningProvider } from './contexts/LearningContext'
import { LoginPage } from './pages/LoginPage'
import { LearningPage } from './pages/LearningPage'
import { ProfilePage } from './pages/ProfilePage'
import { RankingPage } from './pages/RankingPage'
import { AssessmentPage } from './pages/AssessmentPage'
import { getToken } from './utils/storage'

function App() {
  const [currentPage, setCurrentPage] = React.useState<string>(() => {
    const path = window.location.pathname
    if (path === '/learning') return 'learning'
    if (path === '/profile') return 'profile'
    if (path === '/ranking') return 'ranking'
    if (path === '/assessment') return 'assessment'
    return 'login'
  })

  const isLoggedIn = !!getToken()

  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path === '/learning') setCurrentPage('learning')
      else if (path === '/profile') setCurrentPage('profile')
      else if (path === '/ranking') setCurrentPage('ranking')
      else if (path === '/assessment') setCurrentPage('assessment')
      else setCurrentPage('login')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (!isLoggedIn && currentPage !== 'login') {
    return <LoginPage />
  }

  return (
    <AuthProvider>
      <LearningProvider>
        {currentPage === 'login' && <LoginPage />}
        {currentPage === 'learning' && <LearningPage />}
        {currentPage === 'profile' && <ProfilePage />}
        {currentPage === 'ranking' && <RankingPage />}
        {currentPage === 'assessment' && <AssessmentPage />}
      </LearningProvider>
    </AuthProvider>
  )
}

export default App
