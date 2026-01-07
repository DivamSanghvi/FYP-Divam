import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import axios from "axios"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import StrategyForm from "@/components/StrategyForm"
import ValidationPanel from "@/components/ValidationPanel"
import Landing from "@/components/Landing"

// Dynamic import for React Flow (requires client-side only)
const StrategyFlowEditor = dynamic(
  () => import("@/components/StrategyFlowEditor"),
  { ssr: false, loading: () => (
    <div className="h-[500px] glass-card rounded-2xl animate-pulse flex items-center justify-center">
      <div className="text-primary-400 animate-spin text-4xl"></div>
    </div>
  )}
)

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [showApp, setShowApp] = useState(false)
  const [strategy, setStrategy] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

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

  // If already authenticated, return null while redirecting
  if (isAuthenticated) {
    return null
  }

  const handleInterpretStrategy = async (data) => {
    setLoading(true)
    setError(null)
    setStrategy(null)
    setSelectedNode(null)

    try {
      const response = await axios.post("http://localhost:8000/api/v1/strategies/interpret", {
        userQuery: data.description,
        symbol: data.symbol.toUpperCase(),
        timeframe: data.timeframe
      }, {
        withCredentials: true
      })

      if (response.data.success) {
        setStrategy(response.data.strategy)
      } else {
        setError(response.data.message || "Failed to interpret strategy")
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Show landing page first
  if (!showApp) {
    return <Landing onGetStarted={() => setShowApp(true)} />
  }

  return (
    <div className="min-h-screen mesh-bg grid-pattern relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="orb orb-purple w-72 h-72 -top-36 -right-36 animate-float-slow fixed" />
      <div className="orb orb-cyan w-64 h-64 bottom-1/4 -left-32 animate-float fixed" />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="glass border-b border-primary-500/20 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => setShowApp(false)}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xl shadow-lg shadow-primary-500/30">
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">AlgoTrade</h1>
                <p className="text-xs text-dark-400">Strategy Builder</p>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary text-sm px-4 py-2"
              >
                📚 My Strategies
              </motion.button>
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold cursor-pointer"
              >
                U
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <motion.div 
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <StrategyForm 
              onSubmit={handleInterpretStrategy}
              loading={loading}
              error={error}
            />
          </motion.div>

          {/* Output Panel */}
          <motion.div 
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card rounded-2xl p-12 flex items-center justify-center min-h-[500px]"
                >
                  <div className="flex flex-col items-center gap-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 rounded-full border-4 border-primary-500/30 border-t-primary-500"
                    />
                    <div className="text-center">
                      <p className="text-white font-semibold mb-2">Interpreting Your Strategy</p>
                      <p className="text-dark-400 text-sm">AI is analyzing your trading logic...</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {strategy && !loading && (
                <motion.div
                  key="strategy"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Strategy Header */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold gradient-text">Strategy Overview</h2>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.3 }}
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          strategy.isValid 
                            ? 'bg-success/20 text-success border border-success/30' 
                            : 'bg-danger/20 text-danger border border-danger/30'
                        }`}
                      >
                        {strategy.isValid ? "✓ Valid" : "✗ Invalid"}
                      </motion.div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Symbol", value: strategy.symbol, icon: "" },
                        { label: "Timeframe", value: strategy.timeframe, icon: "" },
                        { label: "Nodes", value: strategy.graph?.nodes?.length || 0, icon: "" }
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                          className="glass rounded-xl p-4 text-center"
                        >
                          <div className="text-2xl mb-2"></div>
                          <div className="text-dark-400 text-xs mb-1">{item.label}</div>
                          <div className="text-white font-bold">{item.value}</div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Flow Chart */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card rounded-2xl overflow-hidden"
                  >
                    <div className="p-4 border-b border-primary-500/20 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        Strategy Flow
                      </h3>
                      <span className="text-xs text-dark-400 bg-dark-800 px-3 py-1 rounded-full">
                        Drag to rearrange • Click for details
                      </span>
                    </div>
                    <div className="relative">
                      <StrategyFlowEditor 
                        nodes={strategy.graph?.nodes || []}
                        entryNode={strategy.graph?.entryNode}
                        onNodeClick={setSelectedNode}
                        selectedNode={selectedNode}
                      />
                    </div>
                  </motion.div>

                  {/* Node Details */}
                  <AnimatePresence>
                    {selectedNode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-card rounded-2xl p-6 overflow-hidden"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <span>🔍</span> Node Details
                          </h3>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSelectedNode(null)}
                            className="text-dark-400 hover:text-white transition-colors"
                          >
                            ✕
                          </motion.button>
                        </div>
                        <pre className="glass rounded-xl p-4 text-xs text-primary-300 overflow-x-auto font-mono">
                          {JSON.stringify(selectedNode, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Validation Panel */}
                  <ValidationPanel strategy={strategy} />

                  {/* Strategy Saved Indicator */}
                  {strategy?.id && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass rounded-2xl p-4 border border-success/30 bg-success/10"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-2xl"
                        >
                        </motion.span>
                        <span className="text-success font-semibold">
                          Strategy Saved (ID: {strategy.id.slice(-8)})
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {!loading && !strategy && !error && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card rounded-2xl p-12 text-center min-h-[500px] flex items-center justify-center"
                >
                  <div className="max-w-md">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="text-6xl mb-6"
                    >
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-3">
                      Ready to Build Your Strategy
                    </h3>
                    <p className="text-dark-400 leading-relaxed">
                      Describe your trading strategy in natural language and watch it 
                      transform into an interactive visual algorithm.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  )
}