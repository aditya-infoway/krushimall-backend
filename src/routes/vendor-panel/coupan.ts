// src/routes/vendor-panel/coupon.ts

import { Router } from "express";
import {

  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  updateCouponStatus,
  deleteCoupon,
} from "../../controllers/vendor-panel/coupan.js";

import { verifyVendorToken } from "../../middleware/verifyVendorToken.js";

const router = Router();

// Generate new coupon code


// Create coupon
router.post("/", verifyVendorToken, createCoupon);

// Get all coupons of logged-in vendor
router.get("/", verifyVendorToken, getCoupons);

// Get single coupon
router.get("/:id", verifyVendorToken, getCouponById);

// Update coupon
router.put("/:id", verifyVendorToken, updateCoupon);

// Update coupon status
router.patch("/:id/status", verifyVendorToken, updateCouponStatus);

// Delete coupon
router.delete("/:id", verifyVendorToken, deleteCoupon);

export default router;