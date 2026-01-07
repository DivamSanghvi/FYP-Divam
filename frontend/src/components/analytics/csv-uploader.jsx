"use client"

import { useState, useEffect, useRef } from "react"
import { Upload, TrendingUp, BarChart3, Zap, Shield } from "lucide-react"

export default function CSVUploader({ onFileUpload, isLoading }) {
  const [isDragging, setIsDragging] = useState(false)
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const timeRef = useRef(0)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.name.endsWith(".csv")) {
        onFileUpload(file)
      } else {
        alert("Please upload a CSV file")
      }
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0])
    }
  }

  // Animated candlesticks
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Store candlesticks and price labels
    const candles = []

    // Initialize candlesticks
    const initCandles = () => {
      candles.length = 0
      const numCandles = 25
      const spacing = canvas.width / (numCandles + 1)
      const baseY = canvas.height * 0.5
      const amplitude = canvas.height * 0.35

      for (let i = 0; i < numCandles; i++) {
        const x = spacing * (i + 1)
        const basePrice = baseY + (Math.random() - 0.5) * amplitude
        const open = basePrice + (Math.random() - 0.5) * 50
        const close = open + (Math.random() - 0.5) * 80
        const high = Math.max(open, close) + Math.random() * 100
        const low = Math.min(open, close) - Math.random() * 100
        const price = (open + close) / 2
        const change = close - open
        const changePercent = (change / open) * 100

        candles.push({
          x,
          open,
          high,
          low,
          close,
          speed: 0.8 + Math.random() * 0.7,
          price,
          change,
          changePercent,
        })
      }
    }

    initCandles()

    const animate = () => {
      timeRef.current += 0.02
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw grid lines
      ctx.strokeStyle = "rgba(107, 114, 128, 0.08)"
      ctx.lineWidth = 1
      for (let i = 0; i <= 5; i++) {
        const y = (canvas.height / 5) * i
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Update and draw candlesticks
      candles.forEach((candle, index) => {
        // Move candle to the left
        candle.x -= candle.speed

        // If candle goes off screen, reset it to the right
        if (candle.x < -30) {
          candle.x = canvas.width + 30
          const baseY = canvas.height * 0.5
          const amplitude = canvas.height * 0.35
          const basePrice = baseY + (Math.random() - 0.5) * amplitude
          candle.open = basePrice + (Math.random() - 0.5) * 50
          candle.close = candle.open + (Math.random() - 0.5) * 80
          candle.high = Math.max(candle.open, candle.close) + Math.random() * 100
          candle.low = Math.min(candle.open, candle.close) - Math.random() * 100
          candle.price = (candle.open + candle.close) / 2
          candle.change = candle.close - candle.open
          candle.changePercent = (candle.change / candle.open) * 100
        }

        // Determine if bullish (green) or bearish (red)
        const isGreen = candle.close >= candle.open
        const color = isGreen ? "#22c55e" : "#ef4444"

        // Draw wick (high-low line) - make it long
        ctx.strokeStyle = color
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(candle.x, candle.high)
        ctx.lineTo(candle.x, candle.low)
        ctx.stroke()

        // Draw candle body - make it larger and longer
        const bodyTop = Math.min(candle.open, candle.close)
        const bodyBottom = Math.max(candle.open, candle.close)
        const bodyHeight = Math.max(bodyBottom - bodyTop, 15)
        const candleWidth = 24

        ctx.fillStyle = color
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.fillRect(candle.x - candleWidth / 2, bodyTop, candleWidth, bodyHeight)
        ctx.strokeRect(candle.x - candleWidth / 2, bodyTop, candleWidth, bodyHeight)
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Animated background chart */}
      <div className="absolute inset-0 opacity-20">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Upload area */}
          <div className="space-y-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all shadow-lg ${
                isDragging
                  ? "border-[#22c55e] bg-[#22c55e]/10 scale-105"
                  : "border-[#1f1f1f] bg-[#0d1117]/80 backdrop-blur-sm hover:border-[#374151] hover:bg-[#161b22]/80"
              }`}
            >
              <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragging ? "text-[#22c55e]" : "text-[#9ca3af]"}`} />
              <h2 className="text-xl font-semibold mb-2 text-white">Upload Stock Data</h2>
              <p className="text-[#d1d5db] mb-6">Drag and drop your Yahoo Finance CSV file here</p>
              <label className="inline-block bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#374151] text-white px-8 py-3 rounded-lg font-medium transition-all cursor-pointer shadow-sm hover:shadow-lg hover:scale-105">
                Choose File
                <input type="file" accept=".csv" onChange={handleFileInput} className="hidden" />
              </label>
              {isLoading && (
                <div className="mt-6 flex items-center justify-center gap-2 text-[#d1d5db]">
                  <div className="w-5 h-5 border-2 border-[#374151] border-t-[#22c55e] rounded-full animate-spin"></div>
                  <p className="font-medium">Parsing CSV...</p>
                </div>
              )}
              <p className="text-[#9ca3af] text-xs mt-4">Expected columns: Date, Open, High, Low, Close, Adj Close, Volume</p>
            </div>
          </div>

          {/* Right side - Features */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0d1117]/80 backdrop-blur-sm border border-[#1f1f1f] rounded-lg p-6 hover:border-[#374151] transition-all">
                <TrendingUp className="w-8 h-8 text-[#22c55e] mb-3" />
                <h3 className="text-white font-semibold mb-2">Real-time Charts</h3>
                <p className="text-[#9ca3af] text-sm">Interactive candlestick and line charts with zoom & pan</p>
              </div>

              <div className="bg-[#0d1117]/80 backdrop-blur-sm border border-[#1f1f1f] rounded-lg p-6 hover:border-[#374151] transition-all">
                <BarChart3 className="w-8 h-8 text-[#22c55e] mb-3" />
                <h3 className="text-white font-semibold mb-2">Technical Analysis</h3>
                <p className="text-[#9ca3af] text-sm">SMA, EMA indicators and advanced drawing tools</p>
              </div>

              <div className="bg-[#0d1117]/80 backdrop-blur-sm border border-[#1f1f1f] rounded-lg p-6 hover:border-[#374151] transition-all">
                <Zap className="w-8 h-8 text-[#22c55e] mb-3" />
                <h3 className="text-white font-semibold mb-2">Fast & Responsive</h3>
                <p className="text-[#9ca3af] text-sm">Lightning-fast rendering with smooth animations</p>
              </div>

              <div className="bg-[#0d1117]/80 backdrop-blur-sm border border-[#1f1f1f] rounded-lg p-6 hover:border-[#374151] transition-all">
                <Shield className="w-8 h-8 text-[#22c55e] mb-3" />
                <h3 className="text-white font-semibold mb-2">Professional Tools</h3>
                <p className="text-[#9ca3af] text-sm">Fibonacci, trend lines, and annotation tools</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
