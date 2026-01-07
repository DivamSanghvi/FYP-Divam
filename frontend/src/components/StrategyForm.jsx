import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function StrategyForm({ onSubmit, loading, error }) {
  const [description, setDescription] = useState("")
  const [symbol, setSymbol] = useState("AAPL")
  const [timeframe, setTimeframe] = useState("1D")
  const [focused, setFocused] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!description.trim()) return
    onSubmit({ description, symbol, timeframe })
  }

  const exampleStrategies = [
    {
      icon: "",
      text: "Buy AAPL when RSI(14) drops below 30 and it's before 2 PM. Exit when RSI rises above 70."
    },
    {
      icon: "",
      text: "Enter long when price crosses above EMA(20). Exit if RSI drops below 30."
    },
    {
      icon: "",
      text: "If MACD crosses above signal line and time is between 9:30 and 12:00, buy with 10% equity."
    }
  ]

  return (
    <div className="space-y-4">
      {/* Form Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xl"
          >
            Chat
          </motion.div>
          <div>
            <h2 className="text-lg font-bold text-white">Describe Your Strategy</h2>
            <p className="text-xs text-dark-400">Use natural language</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <motion.div
              animate={{ 
                boxShadow: focused === 'description' 
                  ? '0 0 0 3px rgba(139, 92, 246, 0.3), 0 0 30px rgba(139, 92, 246, 0.1)' 
                  : 'none'
              }}
              className="rounded-xl overflow-hidden"
            >
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={() => setFocused('description')}
                onBlur={() => setFocused(null)}
                placeholder="Buy AAPL when RSI(14) drops below 30 and exit when RSI rises above 70..."
                className="input-glass h-32 resize-none text-sm"
                required
              />
            </motion.div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-dark-500">Be specific about entry & exit conditions</span>
              <span className={`text-xs ${description.length > 200 ? 'text-warning' : 'text-dark-500'}`}>
                {description.length}/500
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-300 mb-2 font-medium">
                <span className="mr-2"></span>Symbol
              </label>
              <motion.input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onFocus={() => setFocused('symbol')}
                onBlur={() => setFocused(null)}
                maxLength="5"
                className="input-glass text-sm uppercase font-bold tracking-wider"
                animate={{ 
                  boxShadow: focused === 'symbol' 
                    ? '0 0 0 3px rgba(139, 92, 246, 0.3)' 
                    : 'none'
                }}
              />
            </div>

            <div>
              <label className="block text-sm text-dark-300 mb-2 font-medium">
                <span className="mr-2"></span>Timeframe
              </label>
              <motion.select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                onFocus={() => setFocused('timeframe')}
                onBlur={() => setFocused(null)}
                className="input-glass text-sm cursor-pointer"
                animate={{ 
                  boxShadow: focused === 'timeframe' 
                    ? '0 0 0 3px rgba(139, 92, 246, 0.3)' 
                    : 'none'
                }}
              >
                <option value="1M">1 Minute</option>
                <option value="5M">5 Minutes</option>
                <option value="15M">15 Minutes</option>
                <option value="1H">1 Hour</option>
                <option value="4H">4 Hours</option>
                <option value="1D">1 Day</option>
                <option value="1W">1 Week</option>
              </motion.select>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading || !description.trim()}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className={`
              w-full py-4 rounded-xl font-semibold text-white transition-all duration-300
              relative overflow-hidden group
              ${loading || !description.trim() 
                ? 'bg-dark-700 cursor-not-allowed' 
                : 'bg-gradient-to-r from-primary-600 to-accent-600 glow-purple'
              }
            `}
          >
            {!loading && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-accent-600 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    
                  </motion.span>
                  Interpreting...
                </>
              ) : (
                <>
                  Generate Strategy
                </>
              )}
            </span>
          </motion.button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mt-4 p-4 rounded-xl bg-danger/10 border border-danger/30 overflow-hidden"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠</span>
                <div>
                  <p className="text-danger font-medium text-sm">Error</p>
                  <p className="text-danger/80 text-xs mt-1">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Examples Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg"></span>
          <h3 className="text-sm font-semibold text-dark-300">Try These Examples</h3>
        </div>
        <div className="space-y-3">
          {exampleStrategies.map((example, i) => (
            <motion.button
              key={i}
              onClick={() => setDescription(example.text)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              className="w-full text-left p-4 glass rounded-xl text-sm text-dark-300 hover:text-white transition-all duration-300 group flex gap-3 items-start"
            >
              <span className="text-lg group-hover:scale-125 transition-transform duration-300">
                {example.icon}
              </span>
              <span className="leading-relaxed">{example.text}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
