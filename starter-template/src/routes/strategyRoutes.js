import { Router } from "express"
import {
  interpretStrategy,
  getStrategy,
  updateStrategy,
  getUserStrategies,
  deleteStrategy,
  duplicateStrategy
} from "../controllers/strategyController.js"
import { verifyAuth } from "../middleware/authMiddleware.js"

const router = Router()

// All strategy routes require authentication
router.use(verifyAuth)

// POST: Interpret natural language into strategy graph
router.post("/interpret", interpretStrategy)

// GET: Fetch all user's strategies
router.get("/my-strategies", getUserStrategies)

// POST: Duplicate a strategy
router.post("/:id/duplicate", duplicateStrategy)

// GET: Fetch specific strategy by ID
router.get("/:id", getStrategy)

// PATCH: Update strategy nodes/graph
router.patch("/:id", updateStrategy)

// DELETE: Delete strategy
router.delete("/:id", deleteStrategy)

export default router
