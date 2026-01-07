import { exec } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Strategy from '../models/Strategy.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to your C++ backtester executable
const BACKTEST_EXE = path.join(__dirname, '../../../cppBacktester/backtest')
const CODEGEN_EXE = path.join(__dirname, '../../../cppBacktester/codegen')
const STRATEGY_DIR = path.join(__dirname, '../../../cppBacktester')

// Helper: Execute shell command
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command failed: ${error.message}\n${stderr}`))
      } else {
        resolve(stdout)
      }
    })
  })
}

// Helper: Read CSV file
async function readCSV(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const lines = content.trim().split('\n')
    if (lines.length < 2) return []
    
    const headers = lines[0].split(',')
    return lines.slice(1).map(line => {
      const values = line.split(',')
      const obj = {}
      headers.forEach((header, i) => {
        obj[header.trim()] = values[i]?.trim() || ''
      })
      return obj
    })
  } catch (error) {
    return []
  }
}

// Helper: Parse metrics text file
function parseMetrics(metricsText) {
  const lines = metricsText.split('\n')
  const metrics = {}
  
  lines.forEach(line => {
    const match = line.match(/^(.+?):\s*\$?([0-9.-]+)(%)?$/)
    if (match) {
      const key = match[1].trim().replace(/\s+/g, '_').toLowerCase()
      const value = parseFloat(match[2])
      metrics[key] = match[3] ? value : value // Keep % indicator if present
    }
  })
  
  return metrics
}

// POST /api/v1/backtest/:id
// Params: strategy id
// Query/Body: startDate, endDate (optional)
export const runBacktest = async (req, res) => {
  try {
    const { id } = req.params
    const { startDate, endDate } = req.body

    // Fetch strategy from database
    const strategy = await Strategy.findById(id)

    if (!strategy) {
      return res.status(404).json({
        success: false,
        message: 'Strategy not found'
      })
    }

    // Verify ownership
    if (strategy.owner && strategy.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not own this strategy'
      })
    }

    // Check if strategy is valid
    if (!strategy.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Cannot backtest invalid strategy',
        validationErrors: strategy.validationErrors
      })
    }

    const symbol = strategy.symbol
    
    // 1. Write strategy.json
    const strategyPath = path.join(STRATEGY_DIR, 'strategy.json')
    const strategyJson = {
      symbol: strategy.symbol,
      timeframe: strategy.timeframe,
      entryNode: strategy.entryNode,
      nodes: strategy.nodes
    }
    await fs.writeFile(strategyPath, JSON.stringify(strategyJson, null, 2))
    
    // 2. Generate C++ code from strategy
    console.log('Generating C++ code from strategy...')
    await executeCommand(`${CODEGEN_EXE} ${strategyPath}`)
    
    // 3. Compile backtest engine (only if code changed)
    console.log('Compiling backtest engine...')
    const compileCmd = `cd ${STRATEGY_DIR} && g++ -std=c++17 main_backtest_improved.cpp runtime/indicators/RSI.cpp runtime/indicators/MACD.cpp -lta-lib -o backtest`
    await executeCommand(compileCmd)
    
    // 4. Run backtest
    console.log('Running backtest...')
    const backtestCmd = startDate && endDate 
      ? `${BACKTEST_EXE} ${symbol} ${startDate} ${endDate}`
      : `${BACKTEST_EXE} ${symbol}`
    
    const output = await executeCommand(backtestCmd)
    
    // 5. Read output files
    const trades = await readCSV(path.join(STRATEGY_DIR, `trades_${symbol}.csv`))
    const metricsText = await fs.readFile(path.join(STRATEGY_DIR, `metrics_${symbol}.txt`), 'utf-8')
    const indicators = await readCSV(path.join(STRATEGY_DIR, `indicators_${symbol}.csv`))
    
    // 6. Parse metrics into JSON
    const metrics = parseMetrics(metricsText)
    
    return res.status(200).json({
      success: true,
      strategyId: strategy._id,
      symbol,
      timeframe: strategy.timeframe,
      trades,
      metrics,
      indicators,
      consoleOutput: output,
      backtestDate: new Date()
    })
    
  } catch (error) {
    console.error('Backtest error:', error)
    return res.status(500).json({
      success: false,
      message: 'Backtest execution failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// GET /api/v1/backtest/health
// Check if C++ backtester is available
export const checkBacktestHealth = async (req, res) => {
  try {
    const checks = {
      backtestExe: false,
      codegenExe: false,
      strategyDir: false
    }

    // Check if executables exist
    try {
      await fs.access(BACKTEST_EXE)
      checks.backtestExe = true
    } catch (err) {
      // File doesn't exist
    }

    try {
      await fs.access(CODEGEN_EXE)
      checks.codegenExe = true
    } catch (err) {
      // File doesn't exist
    }

    try {
      await fs.access(STRATEGY_DIR)
      checks.strategyDir = true
    } catch (err) {
      // Directory doesn't exist
    }

    const allHealthy = Object.values(checks).every(check => check === true)

    return res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      message: allHealthy ? 'Backtest system is ready' : 'Backtest system has missing components',
      checks,
      paths: {
        backtestExe: BACKTEST_EXE,
        codegenExe: CODEGEN_EXE,
        strategyDir: STRATEGY_DIR
      }
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    })
  }
}

export default {
  runBacktest,
  checkBacktestHealth
}
