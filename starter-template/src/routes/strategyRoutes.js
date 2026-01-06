import { Router } from "express"
import {
  interpretStrategy,
  getStrategy,
  updateStrategy,
  getUserStrategies,
  deleteStrategy
} from "../controllers/strategyController.js"

const router = Router()

// POST: Interpret natural language into strategy graph
router.post("/interpret", interpretStrategy)

// GET: Fetch all user's strategies
router.get("/my-strategies", getUserStrategies)

// GET: Fetch specific strategy by ID
router.get("/:id", getStrategy)

// PATCH: Update strategy nodes/graph
router.patch("/:id", updateStrategy)

// DELETE: Delete strategy
router.delete("/:id", deleteStrategy)

export default router
