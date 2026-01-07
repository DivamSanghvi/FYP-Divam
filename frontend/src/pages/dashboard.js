import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'
import { motion } from 'framer-motion'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useBacktest } from '@/hooks/useBacktest'

const Dashboard = () => {
  const router = useRouter()
  const { currentUser, logout, isLoading } = useAuth()
  const { runBacktest, loading: isBacktesting, error: backtestError } = useBacktest()
  const [strategies, setStrategies] = useState([])
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, valid, invalid
  const [showJsonModal, setShowJsonModal] = useState(false)
  const [selectedStrategyJson, setSelectedStrategyJson] = useState(null)

  // Debug: Log currentUser to see its structure
  useEffect(() => {
    console.log('Current User:', currentUser)
  }, [currentUser])

  useEffect(() => {
    if (!isLoading && currentUser) {
      fetchStrategies()
    }
  }, [isLoading, currentUser])

  const fetchStrategies = async () => {
    try {
      setIsLoadingStrategies(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/strategies/my-strategies`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Failed to fetch strategies')

      const data = await response.json()
      setStrategies(data.strategies || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoadingStrategies(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  const handleDeleteStrategy = async (id) => {
    if (!window.confirm('Are you sure you want to delete this strategy?')) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/strategies/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Failed to delete strategy')

      setStrategies(strategies.filter(s => s._id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDuplicateStrategy = async (id) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/strategies/${id}/duplicate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Failed to duplicate strategy')

      const data = await response.json()
      setStrategies([data.strategy, ...strategies])
    } catch (err) {
      setError(err.message)
    }
  }

  const handleBacktestStrategy = async (strategyId) => {
    try {
      // Find the strategy to get its symbol
      const strategy = strategies.find(s => s._id === strategyId)
      
      if (!strategy) {
        setError('Strategy not found')
        return
      }
      
      console.log('Running backtest for:', strategy.symbol)
      
      // Call the actual backtest API
      const data = await runBacktest(strategyId)
      console.log('Backtest completed:', data)
      
      // Store symbol in sessionStorage for analytics page
      sessionStorage.setItem('backtestSymbol', strategy.symbol)
      
      // Redirect to analytics with autoload
      router.push('/analytics?autoload=true')
      
    } catch (err) {
      console.error('Backtest error:', err)
      setError(backtestError || 'Backtest failed: ' + err.message)
    }
  }

  const handleViewStrategy = (id) => {
    router.push(`/editor?id=${id}`)
  }

  const handleCreateNew = () => {
    router.push('/editor')
  }

  const filteredStrategies = strategies.filter(s => {
    if (filter === 'valid') return s.isValid
    if (filter === 'invalid') return !s.isValid
    return true
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Navigation Bar */}
        <nav className="bg-[#0d1117] border-b border-[#1f1f1f] sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              AlgoTrade <span className="text-[#22c55e]">Dashboard</span>
            </h1>
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

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">Your Strategies</h2>
                <p className="text-[#9ca3af]">Manage and create your algorithmic trading strategies</p>
              </div>
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold rounded-lg transition-all shadow-lg"
              >
                Create New Strategy
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              {['all', 'valid', 'invalid'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                    filter === f
                      ? 'bg-[#22c55e] text-white shadow-lg'
                      : 'bg-[#1f1f1f] text-[#9ca3af] hover:bg-[#2a2a2a] border border-[#3a3a3a]'
                  }`}
                >
                  {f === 'all' ? 'All Strategies' : `${f === 'valid' ? 'Valid' : 'Invalid'} Only`}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-[#1f1f1f] border border-[#ef4444] rounded-lg">
              <p className="text-[#ef4444]">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoadingStrategies ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#22c55e] mb-4"></div>
                <p className="text-[#9ca3af]">Loading your strategies...</p>
              </div>
            </div>
          ) : filteredStrategies.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-block p-4 rounded-full bg-[#1f1f1f] border border-[#3a3a3a] mb-4">
                <svg className="w-8 h-8 text-[#9ca3af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6h-6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No strategies yet</h3>
              <p className="text-[#9ca3af] mb-6">Create your first trading strategy to get started</p>
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold rounded-lg transition-all shadow-lg"
              >
                Create First Strategy
              </button>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredStrategies.map(strategy => (
                <motion.div
                  key={strategy._id}
                  variants={itemVariants}
                  className="bg-[#0d1117] border border-[#1f1f1f] rounded-lg p-6 hover:border-[#3a3a3a] transition-all shadow-lg"
                >
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{strategy.symbol}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        strategy.isValid
                          ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30'
                          : 'bg-[#eab308]/10 text-[#eab308] border border-[#eab308]/30'
                      }`}>
                        {strategy.isValid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    <p className="text-sm text-[#9ca3af] line-clamp-2">{strategy.description}</p>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-6 text-sm text-[#9ca3af]">
                    <p>
                      <span className="text-white">Timeframe:</span> {strategy.timeframe}
                    </p>
                    <p>
                      <span className="text-white">Created:</span> {new Date(strategy.createdAt).toLocaleDateString()}
                    </p>
                    {strategy.updatedAt && (
                      <p>
                        <span className="text-white">Updated:</span> {new Date(strategy.updatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewStrategy(strategy._id)}
                      className="flex-1 px-3 py-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-white rounded text-sm font-medium transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDuplicateStrategy(strategy._id)}
                      className="flex-1 px-3 py-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-[#9ca3af] rounded text-sm font-medium transition-colors"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleBacktestStrategy(strategy._id)}
                      disabled={isBacktesting || !strategy.isValid}
                      className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                        isBacktesting || !strategy.isValid
                          ? 'bg-[#1f1f1f] border border-[#3a3a3a] text-[#6b7280] cursor-not-allowed'
                          : 'bg-[#22c55e]/10 hover:bg-[#22c55e]/20 border border-[#22c55e]/30 text-[#22c55e]'
                      }`}
                    >
                      {isBacktesting ? 'Running...' : 'Backtest'}
                    </button>
                    <button
                      onClick={() => handleDeleteStrategy(strategy._id)}
                      className="flex-1 px-3 py-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-[#ef4444] rounded text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* JSON Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0d1117] rounded-xl border border-[#1f1f1f] shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
              <h3 className="text-xl font-bold text-white">Backtest Results</h3>
              <button
                onClick={() => setShowJsonModal(false)}
                className="p-2 hover:bg-[#1f1f1f] rounded-lg transition-colors text-[#9ca3af] hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* JSON Content */}
            <div className="flex-1 overflow-auto p-6">
              <pre className="text-sm text-[#9ca3af] font-mono bg-[#0a0a0a] rounded-lg p-4 overflow-x-auto border border-[#1f1f1f]">
                {selectedStrategyJson}
              </pre>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#1f1f1f] flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedStrategyJson)
                }}
                className="px-4 py-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-white rounded-lg transition-colors text-sm font-medium"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#3a3a3a] text-[#9ca3af] rounded-lg transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </ProtectedRoute>
  )
}

export default Dashboard
