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
      <div className="h-screen w-full flex flex-col bg-[#0a0a0a]">
        {/* Navigation Bar */}
        <nav className="bg-[#0d1117] border-b border-[#1f1f1f] z-50 shadow-lg">
          <div className="max-w-full px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-white">
                AlgoTrade <span className="text-[#22c55e]">Analytics</span>
              </h1>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-sm text-[#9ca3af] hover:text-white transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[#9ca3af] text-sm">
                Welcome, <span className="text-white font-semibold">{currentUser?.email}</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-[#ef4444] rounded-lg transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* Chart Content */}
        <div className="flex-1 overflow-hidden">
          <ChartingApp autoload={autoload === 'true'} symbol={symbol} />
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default Analytics
