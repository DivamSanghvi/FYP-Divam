export function parseCSVData(csv) {
  const lines = csv.trim().split("\n")
  if (lines.length < 2) throw new Error("Invalid CSV")

  // Detect delimiter (tab or comma)
  const delimiter = lines[0].includes("\t") ? "\t" : ","
  const header = lines[0].split(delimiter).map((h) => h.trim().toLowerCase())
  const dateIdx = header.indexOf("date")
  const openIdx = header.indexOf("open")
  const highIdx = header.indexOf("high")
  const lowIdx = header.indexOf("low")
  const closeIdx = header.indexOf("close")
  const volumeIdx = header.indexOf("volume")
  const rsi14Idx = header.indexOf("rsi14")
  const macdIdx = header.indexOf("macd")
  const macdSignalIdx = header.indexOf("macdsignal")
  const macdHistIdx = header.indexOf("macdhist")

  if (dateIdx === -1 || openIdx === -1 || highIdx === -1 || lowIdx === -1 || closeIdx === -1 || volumeIdx === -1) {
    throw new Error("Missing required columns")
  }

  const data = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.split(delimiter).map((p) => p.trim())

    try {
      const dateStr = parts[dateIdx]
      const date = parseDate(dateStr)

      const open = parseNumericValue(parts[openIdx])
      const high = parseNumericValue(parts[highIdx])
      const low = parseNumericValue(parts[lowIdx])
      const close = parseNumericValue(parts[closeIdx])
      const volume = parseNumericValue(parts[volumeIdx])

      // Validate OHLC values are valid numbers
      if (!isFinite(open) || !isFinite(high) || !isFinite(low) || !isFinite(close) || !isFinite(volume)) {
        console.warn(`Skipping row with invalid OHLC values: ${line}`, { open, high, low, close, volume, parts })
        continue
      }

      // Validate price relationships
      if (high < open || high < close || high < low || low > open || low > close || low > high) {
        console.warn(`Skipping row with invalid price relationships: OHLC=${open},${high},${low},${close}`)
        continue
      }

      const ohlcData = {
        date,
        dateStr: dateStr, // Keep original date string from CSV
        open,
        high,
        low,
        close,
        volume,
      }

      // Add optional indicators if they exist
      if (rsi14Idx !== -1 && parts[rsi14Idx]) {
        const rsi14 = parseNumericValue(parts[rsi14Idx])
        if (isFinite(rsi14)) {
          ohlcData.rsi14 = rsi14
        }
      }
      if (macdIdx !== -1 && parts[macdIdx]) {
        const macd = parseNumericValue(parts[macdIdx])
        if (isFinite(macd)) {
          ohlcData.macd = macd
        }
      }
      if (macdSignalIdx !== -1 && parts[macdSignalIdx]) {
        const macdSignal = parseNumericValue(parts[macdSignalIdx])
        if (isFinite(macdSignal)) {
          ohlcData.macdSignal = macdSignal
        }
      }
      if (macdHistIdx !== -1 && parts[macdHistIdx]) {
        const macdHist = parseNumericValue(parts[macdHistIdx])
        if (isFinite(macdHist)) {
          ohlcData.macdHist = macdHist
        }
      }

      data.push(ohlcData)
    } catch (e) {
      console.warn(`Skipping invalid row ${i}: ${line}`, e)
    }
  }

  return data.sort((a, b) => a.date.getTime() - b.date.getTime())
}

function parseNumericValue(value) {
  if (!value || value.trim() === "") {
    return NaN
  }
  
  const trimmed = value.trim()
  const parsed = Number.parseFloat(trimmed)
  
  if (!isFinite(parsed)) {
    console.warn(`Invalid numeric value: "${value}" -> ${parsed}`)
    return NaN
  }
  
  return parsed
}

function parseDate(dateStr) {
  // Try multiple date formats
  const formats = [
    { pattern: /^(\d{2})-(\d{2})-(\d{4})$/, parser: (m) => ({ day: m[1], month: m[2], year: m[3] }) },
    { pattern: /^(\d{4})-(\d{2})-(\d{2})$/, parser: (m) => ({ day: m[3], month: m[2], year: m[1] }) },
    { pattern: /^(\d{2})\/(\d{2})\/(\d{4})$/, parser: (m) => ({ day: m[1], month: m[2], year: m[3] }) },
  ]

  for (const fmt of formats) {
    const match = dateStr.match(fmt.pattern)
    if (match) {
      const { day, month, year } = fmt.parser(match)
      const d = Number.parseInt(day)
      const m = Number.parseInt(month)
      const y = Number.parseInt(year)
      
      if (d > 12) {
        return new Date(y, m - 1, d)
      } else {
        return new Date(y, m - 1, d)
      }
    }
  }

  throw new Error(`Cannot parse date: ${dateStr}`)
}
