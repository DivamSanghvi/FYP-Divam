import { Router } from "express"
import {
  runBacktest,
  checkBacktestHealth
} from "../controllers/backtestController.js"
import { verifyAuth } from "../middleware/authMiddleware.js"

const router = Router()

// Health check endpoint (no auth required)
router.get("/health", checkBacktestHealth)

// All other backtest routes require authentication
router.use(verifyAuth)

// POST: Run backtest on a strategy
router.post("/:id", runBacktest)

export default router
