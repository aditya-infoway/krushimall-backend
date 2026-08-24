import { Router } from "express";

import {
  becomeVendor,
  verifyVendorOTP,
  resendVendorOTP,
  getVendorData,
  updateVendor,
  updateVendorPassword,
  verifyVendor,
  getAllVendors,
  vendorLogin,
  updateVendorStatus,
} from "../controllers/vendor.js";

import { verifyWebToken } from "../middleware/verifyWebToken.js";
import { verifyVendorToken } from "../middleware/verifyVendorToken.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// =========================
// Public
// =========================

router.post("/login", vendorLogin);

router.post("/verify-otp", verifyVendorOTP);

router.post("/resend-otp", resendVendorOTP);

// =========================
// Website User
// =========================

router.post(
  "/become",
  verifyWebToken,
  becomeVendor,
);

// =========================
// Vendor Dashboard
// =========================

router.get(
  "/me",
  verifyVendorToken,
  getVendorData,
);

router.put(
  "/update",
  verifyVendorToken,
  upload.single("avatar"),
  updateVendor,
);

router.put(
  "/update-password",
  verifyVendorToken,
  updateVendorPassword,
);

// =========================
// Admin
// =========================

// Vendor verification
router.put(
  "/verify/:vendorId",
  verifyVendorToken,
  verifyVendor,
);

// Get all vendors
router.get(
  "/all",
  getAllVendors,
);

// Update vendor status
// PENDING <-> ACTIVE
router.patch(
  "/:vendorId/status",

  updateVendorStatus,
);

export default router;