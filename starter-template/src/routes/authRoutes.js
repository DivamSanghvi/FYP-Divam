import { Router } from "express";
import {
  signup,
  login,
  logout,
  verifyToken,
  getCurrentUser,
  deleteAccount,
} from "../controllers/authController.js";
import { verifyAuth } from "../middleware/authMiddleware.js";

const router = Router();

// POST: Register new user
router.post("/signup", signup);

// POST: Login user
router.post("/login", login);

// POST: Logout user (protected)
router.post("/logout", verifyAuth, logout);

// GET: Verify token validity (protected)
router.get("/verify", verifyAuth, verifyToken);

// GET: Get current user info (protected)
router.get("/me", verifyAuth, getCurrentUser);

// DELETE: Delete account and all associated data (protected)
router.delete("/account", verifyAuth, deleteAccount);

export default router;
