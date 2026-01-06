import { useState } from "react"
import axios from "axios"
import dynamic from "next/dynamic"
import StrategyForm from "@/components/StrategyForm"
import ValidationPanel from "@/components/ValidationPanel"

// Dynamic import for React Flow (requires client-side only)
const StrategyFlowEditor = dynamic(
  () => import("@/components/StrategyFlowEditor"),
  { ssr: false, loading: () => <div className="h-[500px] bg-slate-900 rounded-lg animate-pulse" /> }
)

export default function Home() {
  const [strategy, setStrategy] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📈</div>
            <div>
              <h1 className="text-2xl font-bold text-white">AlgoTrade Democratizer</h1>
              <p className="text-sm text-slate-400">Natural language → Visual trading strategies</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <StrategyForm 
              onSubmit={handleInterpretStrategy}
              loading={loading}
              error={error}
            />
          </div>

          {/* Output Panel */}
          <div className="lg:col-span-2">
            {loading && (
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 flex items-center justify-center min-h-96">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin text-3xl">⚙️</div>
                  <p className="text-slate-300">Interpreting your strategy...</p>
                </div>
              </div>
            )}

            {strategy && (
              <div className="space-y-6">
                {/* Strategy Header */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-white mb-4">{strategy.name}</h2>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-slate-400">Symbol</div>
                      <div className="text-white font-semibold">{strategy.symbol}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Timeframe</div>
                      <div className="text-white font-semibold">{strategy.timeframe}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Status</div>
                      <div className={`font-semibold ${strategy.isValid ? "text-green-400" : "text-red-400"}`}>
                        {strategy.isValid ? "✓ Valid" : "✗ Invalid"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flow Chart */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                  <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span>🔗</span> Strategy Flow
                    </h3>
                    <span className="text-xs text-slate-400">Drag nodes to rearrange • Click to see details</span>
                  </div>
                  <div className="relative">
                    <StrategyFlowEditor 
                      nodes={strategy.graph?.nodes || []}
                      entryNode={strategy.graph?.entryNode}
                      onNodeClick={setSelectedNode}
                      selectedNode={selectedNode}
                    />
                  </div>
                </div>

                {/* Node Details */}
                {selectedNode && (
                  <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">🔍 Node Details</h3>
                    <pre className="bg-slate-900 p-4 rounded text-xs text-slate-300 overflow-x-auto">
                      {JSON.stringify(selectedNode, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Validation Panel */}
                <ValidationPanel strategy={strategy} />

                {/* Strategy Saved Indicator */}
                {strategy?.id && (
                  <div className="w-full bg-green-900/50 border border-green-600 text-green-300 font-semibold py-3 rounded-lg text-center">
                    ✅ Strategy Saved (ID: {strategy.id.slice(-8)})
                  </div>
                )}
              </div>
            )}

            {!loading && !strategy && !error && (
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center min-h-96 flex items-center justify-center">
                <div className="text-slate-400">
                  <div className="text-4xl mb-4">✨</div>
                  <p>Describe a trading strategy to see the visual flow here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}