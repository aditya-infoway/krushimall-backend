// src/routes/webAuth.ts
import { verifyToken } from "../middleware/middleware.js";
import { Router } from "express";
import {
  register,
  verifyOTP,
  resendOTP,
  login,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile
} from "../controllers/webauth.js";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
// Protected routes
router.get("/me",  verifyToken, getCurrentUser);
router.put("/profile", verifyToken,  updateProfile);

export default router;