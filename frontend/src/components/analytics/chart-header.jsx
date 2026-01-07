"use client"

const TIMEFRAMES = ["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "ALL"]

export default function ChartHeader({
  fileName,
  data,
  timeframe,
  setTimeframe,
  chartType,
  setChartType,
  indicators,
  setIndicators,
}) {
  const lastPrice = data.length > 0 ? data[data.length - 1].close : 0
  const firstPrice = data.length > 0 ? data[0].close : 0
  const change = lastPrice - firstPrice
  const changePercent = firstPrice > 0 ? ((change / firstPrice) * 100).toFixed(2) : "0.00"
  const isPositive = change >= 0

  // Calculate additional statistics
  const allHighs = data.map((d) => d.high)
  const allLows = data.map((d) => d.low)
  const allVolumes = data.map((d) => d.volume)
  const allCloses = data.map((d) => d.close)

  const periodHigh = data.length > 0 ? Math.max(...allHighs) : 0
  const periodLow = data.length > 0 ? Math.min(...allLows) : 0
  const avgVolume = data.length > 0 ? allVolumes.reduce((a, b) => a + b, 0) / data.length : 0
  const avgPrice = data.length > 0 ? allCloses.reduce((a, b) => a + b, 0) / data.length : 0
  const volatility = data.length > 1
    ? Math.sqrt(
        allCloses.reduce((sum, price, i) => {
          if (i === 0) return sum
          const change = (price - allCloses[i - 1]) / allCloses[i - 1]
          return sum + change * change
        }, 0) / (data.length - 1),
      ) * 100
    : 0

  const lastCandle = data.length > 0 ? data[data.length - 1] : null
  const open = lastCandle?.open || 0
  const high = lastCandle?.high || 0
  const low = lastCandle?.low || 0
  const volume = lastCandle?.volume || 0

  // Technical indicators from latest data
  const rsi14 = lastCandle?.rsi14
  const macd = lastCandle?.macd
  const macdSignal = lastCandle?.macdSignal
  const macdHist = lastCandle?.macdHist

  return (
    <div className="bg-[#0d1117] border-b border-[#1f1f1f] p-4 shadow-sm">
      {/* Top Row - Stock Info */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{fileName}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-2xl font-semibold text-white">${lastPrice.toFixed(2)}</span>
              <span className={`text-lg font-semibold ${isPositive ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                {isPositive ? "+" : ""}
                {change.toFixed(2)} ({changePercent}%)
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-6 text-sm flex-wrap">
          {data.length > 0 && (
            <>
              <div className="text-[#d1d5db]">
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <span className="text-[#9ca3af]">Open:</span> <span className="text-white">${open.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">High:</span> <span className="text-[#22c55e]">${high.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Low:</span> <span className="text-[#ef4444]">${low.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="text-[#d1d5db] border-l border-[#1f1f1f] pl-6">
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <span className="text-[#9ca3af]">Period High:</span> <span className="text-white">${periodHigh.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Period Low:</span> <span className="text-white">${periodLow.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Avg Price:</span> <span className="text-white">${avgPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="text-[#d1d5db] border-l border-[#1f1f1f] pl-6">
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <span className="text-[#9ca3af]">Volume:</span> <span className="text-white">{volume.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Avg Vol:</span> <span className="text-white">{avgVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Volatility:</span> <span className="text-white">{volatility.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
              {(rsi14 !== undefined || macd !== undefined) && (
                <div className="text-[#d1d5db] border-l border-[#1f1f1f] pl-6">
                  <div className="flex gap-4 flex-wrap">
                    {rsi14 !== undefined && (
                      <div>
                        <span className="text-[#9ca3af]">RSI 14:</span> <span className={`text-white ${rsi14 > 70 ? "text-[#ef4444]" : rsi14 < 30 ? "text-[#22c55e]" : "text-white"}`}>{rsi14.toFixed(2)}</span>
                      </div>
                    )}
                    {macd !== undefined && (
                      <div>
                        <span className="text-[#9ca3af]">MACD:</span> <span className={`text-white ${macd > 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{macd.toFixed(6)}</span>
                      </div>
                    )}
                    {macdSignal !== undefined && (
                      <div>
                        <span className="text-[#9ca3af]">Signal:</span> <span className="text-white">{macdSignal.toFixed(6)}</span>
                      </div>
                    )}
                    {macdHist !== undefined && (
                      <div>
                        <span className="text-[#9ca3af]">Hist:</span> <span className={`text-white ${macdHist > 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{macdHist.toFixed(6)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom Row - Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Timeframe Buttons */}
        <div className="flex gap-2 flex-wrap">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                timeframe === tf
                  ? "bg-[#1f1f1f] text-white border border-[#374151] shadow-sm scale-105"
                  : "bg-[#161b22] text-[#d1d5db] border border-[#1f1f1f] hover:bg-[#1a1f26] hover:border-[#374151] hover:scale-102"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Type Switcher */}
        <div className="flex gap-2 border-l border-[#1f1f1f] pl-4">
          {["candlestick", "line", "area"].map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                chartType === type
                  ? "bg-[#1f1f1f] text-white border border-[#374151] shadow-sm scale-105"
                  : "bg-[#161b22] text-[#d1d5db] border border-[#1f1f1f] hover:bg-[#1a1f26] hover:border-[#374151] hover:scale-102"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Indicators */}
        <div className="flex gap-4 border-l border-[#1f1f1f] pl-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm cursor-pointer text-[#d1d5db] hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={indicators.sma20 || false}
              onChange={(e) => setIndicators({ ...indicators, sma20: e.target.checked })}
              className="w-4 h-4 accent-[#22c55e] cursor-pointer"
            />
            SMA 20
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer text-[#d1d5db] hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={indicators.sma50 || false}
              onChange={(e) => setIndicators({ ...indicators, sma50: e.target.checked })}
              className="w-4 h-4 accent-[#22c55e] cursor-pointer"
            />
            SMA 50
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer text-[#d1d5db] hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={indicators.ema20 || false}
              onChange={(e) => setIndicators({ ...indicators, ema20: e.target.checked })}
              className="w-4 h-4 accent-[#22c55e] cursor-pointer"
            />
            EMA 20
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer text-[#d1d5db] hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={indicators.rsi14 || false}
              onChange={(e) => setIndicators({ ...indicators, rsi14: e.target.checked })}
              className="w-4 h-4 accent-[#f59e0b] cursor-pointer"
            />
            RSI 14
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer text-[#d1d5db] hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={indicators.macd || false}
              onChange={(e) => setIndicators({ ...indicators, macd: e.target.checked })}
              className="w-4 h-4 accent-[#3b82f6] cursor-pointer"
            />
            MACD
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer text-[#d1d5db] hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={indicators.macdHist || false}
              onChange={(e) => setIndicators({ ...indicators, macdHist: e.target.checked })}
              className="w-4 h-4 accent-[#10b981] cursor-pointer"
            />
            MACD Hist
          </label>
        </div>
      </div>
    </div>
  )
}
