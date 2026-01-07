export function calculateSMA(prices, period) {
  const result = []

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      result.push(sum / period)
    }
  }

  return result
}

export function calculateEMA(prices, period) {
  const result = []
  const multiplier = 2 / (period + 1)

  // Initialize with SMA
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += prices[i]
    result.push(null)
  }

  let ema = sum / period
  result[period - 1] = ema

  // Calculate EMA
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * multiplier + ema * (1 - multiplier)
    result.push(ema)
  }

  return result
}
