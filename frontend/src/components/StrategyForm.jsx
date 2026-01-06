import { useState } from "react"

export default function StrategyForm({ onSubmit, loading, error }) {
  const [description, setDescription] = useState("")
  const [symbol, setSymbol] = useState("AAPL")
  const [timeframe, setTimeframe] = useState("1D")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!description.trim()) return
    onSubmit({ description, symbol, timeframe })
  }

  const exampleStrategies = [
    "Buy AAPL when RSI(14) drops below 30 and it's before 2 PM. Exit when RSI rises above 70.",
    "Enter long when price crosses above EMA(20) AND RSI is above 50. Exit if RSI drops below 30.",
    "If MACD crosses above signal line and time is between 9:30 and 12:00, buy with 10% equity."
  ]

  return (
    <div className="space-y-4">
      {/* Form Card */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">💬 Describe Your Strategy</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Buy AAPL when RSI(14) drops below 30 and it's before 2 PM. Exit when RSI rises above 70."
              className="w-full h-32 px-4 py-3 bg-slate-900 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              maxLength="5"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="1M">1 Minute</option>
              <option value="5M">5 Minutes</option>
              <option value="15M">15 Minutes</option>
              <option value="1H">1 Hour</option>
              <option value="4H">4 Hours</option>
              <option value="1D">1 Day</option>
              <option value="1W">1 Week</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !description.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2.5 rounded transition text-sm"
          >
            {loading ? "⚙️ Interpreting..." : "🚀 Generate Strategy"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Examples Card */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">💡 Try These Examples</h3>
        <div className="space-y-2">
          {exampleStrategies.map((example, i) => (
            <button
              key={i}
              onClick={() => setDescription(example)}
              className="w-full text-left p-3 bg-slate-900 hover:bg-slate-700 border border-slate-600 rounded text-sm text-slate-300 hover:text-white transition"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
