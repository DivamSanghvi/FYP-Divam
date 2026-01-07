import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'
import { motion } from 'framer-motion'
import ProtectedRoute from '@/components/ProtectedRoute'

const Dashboard = () => {
  const router = useRouter()
  const { currentUser, logout, isLoading } = useAuth()
  const [strategies, setStrategies] = useState([])
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, valid, invalid

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Navigation Bar */}
        <nav className="bg-slate-800/50 backdrop-blur-xl border-b border-purple-500/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              AlgoTrade
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm">
                Welcome, <span className="text-cyan-400 font-semibold">{currentUser?.email}</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg transition-colors text-sm font-medium"
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
                <p className="text-gray-400">Manage and create your algorithmic trading strategies</p>
              </div>
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
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
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                      : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  {f === 'all' ? 'All Strategies' : `${f === 'valid' ? 'Valid' : 'Invalid'} Only`}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoadingStrategies ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
                <p className="text-gray-400">Loading your strategies...</p>
              </div>
            </div>
          ) : filteredStrategies.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-block p-4 rounded-full bg-purple-500/20 mb-4">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6h-6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No strategies yet</h3>
              <p className="text-gray-400 mb-6">Create your first trading strategy to get started</p>
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
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
                  className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-lg p-6 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20"
                >
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{strategy.symbol}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        strategy.isValid
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                      }`}>
                        {strategy.isValid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2">{strategy.description}</p>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-6 text-sm text-gray-400">
                    <p>
                      <span className="text-cyan-400">Timeframe:</span> {strategy.timeframe}
                    </p>
                    <p>
                      <span className="text-cyan-400">Created:</span> {new Date(strategy.createdAt).toLocaleDateString()}
                    </p>
                    {strategy.updatedAt && (
                      <p>
                        <span className="text-cyan-400">Updated:</span> {new Date(strategy.updatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewStrategy(strategy._id)}
                      className="flex-1 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-400 rounded text-sm font-medium transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDuplicateStrategy(strategy._id)}
                      className="flex-1 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400 rounded text-sm font-medium transition-colors"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleDeleteStrategy(strategy._id)}
                      className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded text-sm font-medium transition-colors"
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
    </ProtectedRoute>
  )
}

export default Dashboard
