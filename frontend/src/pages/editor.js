import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'

// Dynamic import for React Flow (requires client-side only)
const StrategyFlowEditor = dynamic(
  () => import('@/components/StrategyFlowEditor'),
  { ssr: false, loading: () => (
    <div className="h-[500px] glass-card rounded-2xl animate-pulse flex items-center justify-center">
      <div className="text-primary-400 animate-spin text-4xl"></div>
    </div>
  )}
)

import StrategyForm from '@/components/StrategyForm'
import ValidationPanel from '@/components/ValidationPanel'

const Editor = () => {
  const router = useRouter()
  const { currentUser, isLoading } = useAuth()
  const [strategy, setStrategy] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const { id } = router.query

  // Load strategy if editing
  useEffect(() => {
    if (id && !isLoading) {
      loadStrategy(id)
    }
  }, [id, isLoading])

  const loadStrategy = async (strategyId) => {
    try {
      setLoading(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/strategies/${strategyId}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) throw new Error('Failed to load strategy')

      const data = await response.json()
      setStrategy(data.strategy)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInterpretStrategy = async (data) => {
    setLoading(true)
    setError(null)
    setStrategy(null)
    setSelectedNode(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/strategies/interpret`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userQuery: data.description,
            symbol: data.symbol.toUpperCase(),
            timeframe: data.timeframe
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to interpret strategy')
      }

      const result = await response.json()
      setStrategy(result.strategy)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveStrategy = async () => {
    if (!strategy) return

    try {
      setLoading(true)
      
      // Convert operator abbreviations back to actual operators before saving
      let nodesToSave = (strategy.nodes || strategy.graph?.nodes || []).map(node => {
        if (node.type === 'condition' && node.expr?.op) {
          const op = node.expr.op === 'gte' ? '>=' : node.expr.op === 'lte' ? '<=' : node.expr.op
          return { ...node, expr: { ...node.expr, op } }
        }
        return node
      })
      
      if (strategy._id) {
        // Update existing strategy
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/strategies/${strategy._id}`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              nodes: nodesToSave,
              entryNode: strategy.entryNode
            })
          }
        )

        if (!response.ok) throw new Error('Failed to update strategy')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateNode = (nodeId, updates) => {
    setStrategy(prev => {
      const nodes = prev.nodes || prev.graph?.nodes || []
      const updatedNodes = nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
      
      if (prev.nodes) {
        return { ...prev, nodes: updatedNodes }
      } else {
        return { ...prev, graph: { ...prev.graph, nodes: updatedNodes } }
      }
    })
  }

  const handleDeleteNode = (nodeId) => {
    setStrategy(prev => {
      const nodes = prev.nodes || prev.graph?.nodes || []
      const newNodes = nodes.filter(node => node.id !== nodeId)
      const newEntryNode = (prev.entryNode || prev.graph?.entryNode) === nodeId ? (newNodes[0]?.id || null) : (prev.entryNode || prev.graph?.entryNode)
      
      if (prev.nodes) {
        return {
          ...prev,
          nodes: newNodes,
          entryNode: newEntryNode
        }
      } else {
        return {
          ...prev,
          graph: { ...prev.graph, nodes: newNodes },
          entryNode: newEntryNode
        }
      }
    })
    setSelectedNode(null)
  }

  const handleBack = () => {
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-xl border-b border-purple-500/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {strategy ? `Edit: ${strategy.symbol}` : 'Create Strategy'}
              </h1>
            </div>
            {strategy && (
              <button
                onClick={handleSaveStrategy}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Strategy'}
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {!strategy ? (
            <div className="max-w-2xl mx-auto">
              <StrategyForm
                onSubmit={handleInterpretStrategy}
                loading={loading}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Graph Editor */}
                <div className="lg:col-span-2">
                  <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Strategy Graph</h2>
                    <StrategyFlowEditor
                      nodes={strategy.nodes || strategy.graph?.nodes || []}
                      entryNode={strategy.entryNode || strategy.graph?.entryNode}
                      onNodeClick={setSelectedNode}
                    />
                  </div>
                </div>

                {/* Right Panel: Validation + Info */}
                <div className="lg:col-span-1 space-y-6">
                  <ValidationPanel strategy={strategy} />
                </div>
              </div>

              {/* Node Editor Modal */}
              {selectedNode && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                  onClick={() => setSelectedNode(null)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30 rounded-lg p-8 w-full max-w-md shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        Edit Node
                      </h2>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="text-gray-400 hover:text-white transition-colors text-2xl"
                      >
                        ✕
                      </button>
                    </div>

                    {(() => {
                      const nodes = strategy.nodes || strategy.graph?.nodes || []
                      const node = nodes.find(n => n.id === selectedNode.id)
                      if (!node) return null

                      return (
                        <div className="space-y-5">
                          {/* Node ID */}
                          <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Node ID</label>
                            <div className="px-4 py-2 bg-slate-700/30 border border-slate-600/50 rounded-lg text-sm text-gray-300 font-mono break-all">
                              {node.id}
                            </div>
                          </div>

                          {/* Node Type */}
                          <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Type</label>
                            <div className="px-4 py-2 bg-slate-700/30 border border-slate-600/50 rounded-lg text-sm text-gray-300 capitalize">
                              {node.type}
                            </div>
                          </div>

                          {/* Editable Fields */}
                          {node.type === 'action' && (
                            <>
                              <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Action Type</label>
                                <select
                                  value={node.data?.label || node.action || ''}
                                  onChange={(e) => handleUpdateNode(node.id, { 
                                    data: { ...node.data, label: e.target.value },
                                    action: e.target.value 
                                  })}
                                  className="w-full px-4 py-2 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
                                >
                                  <option value="">Select action</option>
                                  <option value="ENTER_LONG">ENTER_LONG</option>
                                  <option value="ENTER_SHORT">ENTER_SHORT</option>
                                  <option value="EXIT_LONG">EXIT_LONG</option>
                                  <option value="EXIT_SHORT">EXIT_SHORT</option>
                                  <option value="NO_ACTION">NO_ACTION</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Symbol</label>
                                <input
                                  type="text"
                                  value={node.symbol || node.data?.symbol || ''}
                                  onChange={(e) => handleUpdateNode(node.id, { 
                                    symbol: e.target.value,
                                    data: { ...node.data, symbol: e.target.value }
                                  })}
                                  className="w-full px-4 py-2 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
                                  placeholder="e.g., AAPL, BTC"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Quantity (%)</label>
                                <input
                                  type="number"
                                  value={node.data?.quantity || 100}
                                  onChange={(e) => handleUpdateNode(node.id, { 
                                    data: { ...node.data, quantity: parseFloat(e.target.value) }
                                  })}
                                  className="w-full px-4 py-2 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
                                  placeholder="e.g., 100"
                                  min="0"
                                  max="100"
                                />
                                <p className="text-xs text-gray-500 mt-1">0-100%</p>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Stop Loss %</label>
                                <input
                                  type="number"
                                  value={node.data?.stopLoss || 0}
                                  onChange={(e) => handleUpdateNode(node.id, { 
                                    data: { ...node.data, stopLoss: parseFloat(e.target.value) }
                                  })}
                                  className="w-full px-4 py-2 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
                                  placeholder="e.g., 2 (for 2%)"
                                  step="0.1"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Take Profit %</label>
                                <input
                                  type="number"
                                  value={node.data?.takeProfit || 0}
                                  onChange={(e) => handleUpdateNode(node.id, { 
                                    data: { ...node.data, takeProfit: parseFloat(e.target.value) }
                                  })}
                                  className="w-full px-4 py-2 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
                                  placeholder="e.g., 5 (for 5%)"
                                  step="0.1"
                                />
                              </div>
                            </>
                          )}

                          {node.type === 'condition' && (
                            <>
                              <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Condition Name</label>
                                <input
                                  type="text"
                                  value={node.data?.label || ''}
                                  onChange={(e) => handleUpdateNode(node.id, { 
                                    data: { ...node.data, label: e.target.value }
                                  })}
                                  className="w-full px-4 py-2 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
                                  placeholder="e.g., RSI Overbought"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Operator</label>
                                <select
                                  value={node.expr?.op || node.condition?.op || ''}
                                  onChange={(e) => handleUpdateNode(node.id, { 
                                    expr: { ...(node.expr || node.condition), op: e.target.value },
                                    condition: { ...(node.expr || node.condition), op: e.target.value }
                                  })}
                                  className="w-full px-4 py-2 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
                                >
                                  <option value="">Select operator</option>
                                  <option value=">">Greater than (&gt;)</option>
                                  <option value="<">Less than (&lt;)</option>
                                  <option value="==">Equal (==)</option>
                                  <option value="!=">Not equal (!=)</option>
                                  <option value="gte">Greater or equal (&gt;=)</option>
                                  <option value="lte">Less or equal (&lt;=)</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Compare Value</label>
                                <input
                                  type="text"
                                  value={node.expr?.right?.value || node.condition?.right?.value || ''}
                                  onChange={(e) => {
                                    const value = isNaN(e.target.value) ? e.target.value : parseFloat(e.target.value)
                                    const expr = node.expr || node.condition || {}
                                    handleUpdateNode(node.id, { 
                                      expr: { 
                                        ...expr, 
                                        right: { ...expr.right, value }
                                      },
                                      condition: { 
                                        ...expr, 
                                        right: { ...expr.right, value }
                                      }
                                    })
                                  }}
                                  className="w-full px-4 py-2 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
                                  placeholder="e.g., 70 or 0.75"
                                />
                              </div>
                            </>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-4">
                            <button
                              onClick={() => handleDeleteNode(node.id)}
                              className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg transition-colors font-medium"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setSelectedNode(null)}
                              className="flex-1 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-400 rounded-lg transition-colors font-medium"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )
                    })()}
                  </motion.div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default Editor
