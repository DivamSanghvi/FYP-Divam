import React from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import ChartingApp from '@/components/analytics/charting-app'

const Analytics = () => {
  const router = useRouter()
  const { currentUser, logout } = useAuth()
  const { autoload } = router.query
  
  // Get symbol from sessionStorage
  const symbol = typeof window !== 'undefined' ? sessionStorage.getItem('backtestSymbol') : null

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <ProtectedRoute>
      <div className="h-screen w-full bg-[#0a0a0a]">
        <ChartingApp autoload={autoload === 'true'} symbol={symbol} />
      </div>
    </ProtectedRoute>
  )
}

export default Analytics
