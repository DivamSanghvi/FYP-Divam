"use client"

import { useRef, forwardRef, useEffect, useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Chart } from "react-chartjs-2"
import { calculateSMA, calculateEMA } from "@/lib/analytics/indicators"
import DrawingCanvas from "./drawing-canvas"

const candlestickPlugin = {
  id: "candlestick",
  afterDatasetsDraw(chart) {
    const { ctx, data, chartArea, scales } = chart
    if (!data.datasets.length) return

    const dataset = data.datasets[0]
    if (!dataset.candleData) return

    const xScale = scales.x
    const yScale = scales.y
    const candleData = dataset.candleData
    const candleWidth = Math.max((xScale.width / candleData.length) * 0.6, 2)

    candleData.forEach((candle, index) => {
      const xPos = xScale.getPixelForValue(index)
      
      // Get pixel positions for each price level
      const openY = yScale.getPixelForValue(candle.o)
      const closeY = yScale.getPixelForValue(candle.c)
      const highY = yScale.getPixelForValue(candle.h)
      const lowY = yScale.getPixelForValue(candle.l)

      // Safety check: ensure values are within chart area
      if (isNaN(openY) || isNaN(closeY) || isNaN(highY) || isNaN(lowY)) {
        console.warn(`Invalid candle value at index ${index}:`, candle)
        return
      }

      const color = candle.c >= candle.o ? "#22c55e" : "#ef4444"
      const wickColor = candle.c >= candle.o ? "#22c55e" : "#ef4444"

      // Draw wick (high-low line)
      ctx.strokeStyle = wickColor
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(xPos, highY)
      ctx.lineTo(xPos, lowY)
      ctx.stroke()

      // Draw candle body
      ctx.fillStyle = color
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      const bodyTop = Math.min(openY, closeY)
      const bodyBottom = Math.max(openY, closeY)
      const bodyHeight = Math.max(bodyBottom - bodyTop, 1)

      ctx.fillRect(xPos - candleWidth / 2, bodyTop, candleWidth, bodyHeight)
      ctx.strokeRect(xPos - candleWidth / 2, bodyTop, candleWidth, bodyHeight)
    })
  },
}

const tradesPlugin = {
  id: "trades",
  afterDatasetsDraw(chart) {
    const { ctx, data, scales } = chart
    if (!chart.options.plugins?.trades?.data) return

    const trades = chart.options.plugins.trades.data
    const xScale = scales.x
    const yScale = scales.y
    const chartData = data.datasets[0]?.data || []

    trades.forEach((trade) => {
      // Find the index of entry and exit times in the chart data
      const entryDate = new Date(trade.EntryTime)
      const exitDate = new Date(trade.ExitTime)
      
      const entryIndex = chartData.findIndex(d => {
        const dataDate = new Date(d.x)
        return Math.abs(dataDate - entryDate) < 24 * 60 * 60 * 1000 // Within 1 day
      })
      
      const exitIndex = chartData.findIndex(d => {
        const dataDate = new Date(d.x)
        return Math.abs(dataDate - exitDate) < 24 * 60 * 60 * 1000
      })

      if (entryIndex === -1 || exitIndex === -1) return

      const entryPrice = parseFloat(trade.EntryPrice)
      const exitPrice = parseFloat(trade.ExitPrice)
      const pnl = parseFloat(trade.PnL)
      
      const entryX = xScale.getPixelForValue(entryIndex)
      const exitX = xScale.getPixelForValue(exitIndex)
      const entryY = yScale.getPixelForValue(entryPrice)
      const exitY = yScale.getPixelForValue(exitPrice)

      // Draw entry marker (green arrow up)
      ctx.save()
      ctx.fillStyle = "#22c55e"
      ctx.strokeStyle = "#22c55e"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(entryX, entryY + 10)
      ctx.lineTo(entryX - 5, entryY + 20)
      ctx.lineTo(entryX + 5, entryY + 20)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      // Draw exit marker (red arrow down or green arrow down depending on PnL)
      ctx.save()
      ctx.fillStyle = pnl >= 0 ? "#22c55e" : "#ef4444"
      ctx.strokeStyle = pnl >= 0 ? "#22c55e" : "#ef4444"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(exitX, exitY - 10)
      ctx.lineTo(exitX - 5, exitY - 20)
      ctx.lineTo(exitX + 5, exitY - 20)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      // Draw line connecting entry to exit
      ctx.save()
      ctx.strokeStyle = pnl >= 0 ? "#22c55e80" : "#ef444480"
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(entryX, entryY)
      ctx.lineTo(exitX, exitY)
      ctx.stroke()
      ctx.restore()
    })
  },
}

// Register base plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  candlestickPlugin,
  tradesPlugin
)

const ChartDisplay = forwardRef(({ data, chartType, indicators, drawingMode, trades = [] }, ref) => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [zoomPluginLoaded, setZoomPluginLoaded] = useState(false)

  // Load zoom plugin only on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("chartjs-plugin-zoom").then((zoomPlugin) => {
        ChartJS.register(zoomPlugin.default)
        setZoomPluginLoaded(true)
      })
    }
  }, [])

  const getChartData = () => {
    if (!data.length) {
      return { labels: [], datasets: [], priceMin: 0, priceMax: 0 }
    }

    const labels = data.map((d) => d.dateStr)
    const datasets = []

    // Calculate min/max for proper y-axis scaling
    const allPrices = data.flatMap((d) => [d.open, d.high, d.low, d.close])
    const priceMin = Math.min(...allPrices)
    const priceMax = Math.max(...allPrices)
    
    // Ensure valid numbers
    if (!isFinite(priceMin) || !isFinite(priceMax) || priceMin === priceMax) {
      console.error("Invalid price range:", { priceMin, priceMax, allPrices: allPrices.slice(0, 5) })
      return { labels: [], datasets: [], priceMin: 0, priceMax: 100 }
    }
    
    console.log("Chart Data Debug:", {
      dataLength: data.length,
      allPrices: allPrices.slice(0, 10),
      priceMin,
      priceMax,
      firstCandle: data[0],
      lastCandle: data[data.length - 1],
    })

    if (chartType === "candlestick") {
      const candleData = data.map((d) => ({
        o: d.open,
        h: d.high,
        l: d.low,
        c: d.close,
      }))

      const candleDataset = {
        label: "Candlestick",
        data: data.map((d) => d.close), // Close prices for positioning
        candleData: candleData, // Store OHLC data for custom rendering
        borderColor: "transparent",
        backgroundColor: "transparent",
        borderWidth: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBorderWidth: 0,
        fill: false,
        tension: 0,
        showLine: false,
        yAxisID: "y", // Explicitly use the price axis
      }
      datasets.push(candleDataset)
    } else if (chartType === "line") {
      const lineData = {
        label: "Close Price",
        data: data.map((d) => d.close),
        borderColor: "#ffffff",
        borderWidth: 1.5,
        fill: false,
        pointRadius: 0,
        tension: 0.1,
        yAxisID: "y",
      }
      datasets.push(lineData)
    } else if (chartType === "area") {
      const areaData = {
        label: "Close Price",
        data: data.map((d) => d.close),
        borderColor: "#ffffff",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1.5,
        fill: true,
        pointRadius: 0,
        tension: 0.1,
        yAxisID: "y",
      }
      datasets.push(areaData)
    }

    // Add indicators
    if (indicators.sma20) {
      const sma20 = calculateSMA(
        data.map((d) => d.close),
        20,
      )
      datasets.push({
        label: "SMA 20",
        data: sma20,
        borderColor: "#9ca3af",
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        tension: 0,
        yAxisID: "y",
      })
    }

    if (indicators.sma50) {
      const sma50 = calculateSMA(
        data.map((d) => d.close),
        50,
      )
      datasets.push({
        label: "SMA 50",
        data: sma50,
        borderColor: "#6b7280",
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        tension: 0,
        yAxisID: "y",
      })
    }

    if (indicators.ema20) {
      const ema20 = calculateEMA(
        data.map((d) => d.close),
        20,
      )
      datasets.push({
        label: "EMA 20",
        data: ema20,
        borderColor: "#d1d5db",
        borderWidth: 1.5,
        fill: false,
        pointRadius: 0,
        tension: 0,
        yAxisID: "y",
      })
    }

    // Add RSI14 if available
    if (indicators.rsi14) {
      const rsi14Data = data.map((d) => d.rsi14 ?? null)
      datasets.push({
        label: "RSI 14",
        data: rsi14Data,
        borderColor: "#f59e0b",
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        tension: 0.1,
        yAxisID: "y1",
      })
    }

    // Add MACD if available
    if (indicators.macd) {
      const macdData = data.map((d) => d.macd ?? null)
      const macdSignalData = data.map((d) => d.macdSignal ?? null)
      datasets.push({
        label: "MACD",
        data: macdData,
        borderColor: "#3b82f6",
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        tension: 0.1,
        yAxisID: "y1",
      })
      datasets.push({
        label: "MACD Signal",
        data: macdSignalData,
        borderColor: "#ec4899",
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        tension: 0.1,
        yAxisID: "y1",
      })
    }

    // Add MACD Histogram if available
    if (indicators.macdHist) {
      const macdHistData = data.map((d) => d.macdHist ?? null)
      datasets.push({
        label: "MACD Histogram",
        data: macdHistData,
        backgroundColor: (context) => {
          const value = context.parsed.y
          return value >= 0 ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"
        },
        borderColor: "transparent",
        fill: true,
        pointRadius: 0,
        tension: 0,
        yAxisID: "y1",
        type: "bar",
      })
    }

    return { labels, datasets, priceMin, priceMax }
  }

  const chartData = getChartData()
  const priceMin = chartData.priceMin ?? 0
  const priceMax = chartData.priceMax ?? 0
  
  console.log("Chart Scale Configuration:", {
    priceMin,
    priceMax,
    rangeWidth: priceMax - priceMin,
    yScaleMin: priceMin > 0 ? priceMin * 0.98 : 0,
    yScaleMax: priceMax > 0 ? priceMax * 1.02 : 100,
  })

  const options = {
    onHover: (event, activeElements) => {
      // Enable crosshair cursor
      if (event.native && event.native.target) {
        event.native.target.style.cursor = activeElements.length > 0 ? "crosshair" : "default"
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 0,
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      trades: {
        data: trades,
      },
      legend: {
        display: true,
        labels: {
          color: "#e5e7eb",
          usePointStyle: true,
          padding: 15,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: "rgba(10, 10, 10, 0.98)",
        titleColor: "#ffffff",
        bodyColor: "#e5e7eb",
        borderColor: "#374151",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        titleFont: { size: 13, weight: "bold" },
        bodyFont: { size: 12 },
        cornerRadius: 4,
        callbacks: {
          title: (context) => {
            const dataIndex = context[0].dataIndex
            if (dataIndex >= 0 && dataIndex < data.length) {
              return data[dataIndex].dateStr
            }
            return ""
          },
          label: (context) => {
            const dataIndex = context.dataIndex
            if (dataIndex >= 0 && dataIndex < data.length && chartType === "candlestick") {
              const candle = data[dataIndex]
              const change = candle.close - candle.open
              const changePercent = candle.open > 0 ? ((change / candle.open) * 100).toFixed(2) : "0.00"
              const isPositive = change >= 0
              
              const labels = [
                `Open: $${candle.open.toFixed(2)}`,
                `High: $${candle.high.toFixed(2)}`,
                `Low: $${candle.low.toFixed(2)}`,
                `Close: $${candle.close.toFixed(2)} ${isPositive ? "+" : ""}${change.toFixed(2)} (${isPositive ? "+" : ""}${changePercent}%)`,
                `Volume: ${candle.volume.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
              ]
              
              // Add technical indicators if available
              if (candle.rsi14 !== undefined) {
                labels.push(`RSI 14: ${candle.rsi14.toFixed(2)}`)
              }
              if (candle.macd !== undefined) {
                labels.push(`MACD: ${candle.macd.toFixed(6)}`)
              }
              if (candle.macdSignal !== undefined) {
                labels.push(`MACD Signal: ${candle.macdSignal.toFixed(6)}`)
              }
              if (candle.macdHist !== undefined) {
                labels.push(`MACD Hist: ${candle.macdHist.toFixed(6)}`)
              }
              
              return labels
            }
            
            // For other chart types, show the label normally
            const label = context.dataset.label || ""
            const value = context.parsed.y
            if (label.includes("RSI")) {
              return `${label}: ${value.toFixed(2)}`
            } else if (label.includes("MACD") || label.includes("Signal")) {
              return `${label}: ${value.toFixed(6)}`
            }
            return label + ": $" + value.toFixed(2)
          },
          afterLabel: (context) => {
            const dataIndex = context.dataIndex
            if (dataIndex >= 0 && dataIndex < data.length && chartType === "candlestick") {
              return ""
            }
            return ""
          },
        },
      },
      zoom: zoomPluginLoaded
        ? {
            zoom: {
              wheel: {
                enabled: true,
                speed: 0.15,
                modifierKey: "ctrl",
              },
              pinch: {
                enabled: true,
              },
              mode: "xy",
            },
            pan: {
              enabled: true,
              mode: "xy",
              modifierKey: null,
            },
          }
        : undefined,
    },
    scales: {
      y: {
        type: "linear",
        position: "right",
        min: priceMin > 0 ? priceMin * 0.98 : 0,
        max: priceMax > 0 ? priceMax * 1.02 : 100,
        beginAtZero: false,
        grid: {
          color: "rgba(107, 114, 128, 0.15)",
          drawBorder: false,
          lineWidth: 1,
        },
        ticks: {
          color: "#d1d5db",
          font: { size: 12 },
          callback: (value) => `$${value.toFixed(2)}`,
        },
      },
      y1: {
        type: "linear",
        position: "left",
        grid: {
          color: "rgba(107, 114, 128, 0.15)",
          drawBorder: false,
          lineWidth: 1,
        },
        ticks: {
          color: "#d1d5db",
          font: { size: 12 },
          callback: (value) => value.toFixed(2),
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: "#d1d5db",
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 0,
          maxTicksLimit: 20,
        },
      },
    },
  }

  const chartTypeToUse = chartType === "candlestick" ? "line" : "line"

  return (
    <div ref={containerRef} className="flex-1 flex flex-col bg-[#0a0a0a] relative overflow-hidden">
      <div className="flex-1 p-4 relative">
        <Chart ref={canvasRef} type={chartTypeToUse} data={chartData} options={options} />
        {drawingMode && <DrawingCanvas containerRef={containerRef} drawingMode={drawingMode} />}
        {drawingMode && (
          <div className="absolute top-4 left-4 bg-[#0d1117] border border-[#1f1f1f] px-3 py-1.5 rounded text-xs text-[#9ca3af] z-10">
            Drawing Mode: <span className="text-white font-medium capitalize">{drawingMode}</span>
            <span className="ml-2 text-[#6b7280]">Press Esc to cancel</span>
          </div>
        )}
      </div>

      {/* Volume Bar Chart */}
      <div className="h-24 bg-[#0a0a0a] border-t border-[#1f1f1f] p-4">
        <VolumeChart data={data} labels={chartData.labels} />
      </div>
    </div>
  )
})

ChartDisplay.displayName = "ChartDisplay"

function VolumeChart({ data, labels }) {
  const volumeRef = useRef(null)

  const chartData = {
    labels,
    datasets: [
      {
        label: "Volume",
        data: data.map((d) => d.volume),
        backgroundColor: data.map((d, i) => {
          if (i === 0) return "rgba(34, 197, 94, 0.6)"
          return data[i].close >= data[i - 1].close ? "rgba(34, 197, 94, 0.6)" : "rgba(239, 68, 68, 0.6)"
        }),
        borderWidth: 0,
        borderRadius: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(10, 10, 10, 0.95)",
        titleColor: "#ffffff",
        bodyColor: "#e5e7eb",
        borderColor: "#374151",
        borderWidth: 1,
        padding: 8,
        callbacks: {
          label: (context) => {
            const volume = context.parsed.y
            return `Volume: ${volume.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
          },
        },
      },
    },
    scales: {
      y: {
        type: "linear",
        position: "right",
        grid: { color: "rgba(107, 114, 128, 0.15)", drawBorder: false, lineWidth: 1 },
        ticks: {
          color: "#9ca3af",
          font: { size: 10 },
          callback: (value) => `${(value / 1e6).toFixed(0)}M`,
        },
      },
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { display: false },
      },
    },
  }

  return <Chart ref={volumeRef} type="bar" data={chartData} options={options} />
}

export default ChartDisplay
