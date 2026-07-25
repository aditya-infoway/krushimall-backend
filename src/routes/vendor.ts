import { Router } from "express";
import {
  becomeVendor,
  getVendorData,
  updateVendor,
  updateVendorPassword,
  verifyVendor,
  getAllVendors,
  vendorLogin,
} from "../controllers/vendor.js";

import { verifyWebToken } from "../middleware/verifyWebToken.js";
import { verifyVendorToken } from "../middleware/verifyVendorToken.js";





const router = Router();



// =========================
// Public
// =========================

router.post("/login", vendorLogin);

// =========================
// Website User
// =========================

// User is logged into the website and wants to become a vendor
router.post("/become", verifyWebToken, becomeVendor);

// =========================
// Vendor Dashboard
// =========================

router.get("/me", verifyVendorToken, getVendorData);

router.put("/update", verifyVendorToken, updateVendor);

router.put("/update-password", verifyVendorToken, updateVendorPassword);

// =========================
// Admin
// =========================

// Later these should use your admin verifyToken middleware,
// not verifyVendorToken.
router.put("/verify/:vendorId", verifyVendorToken, verifyVendor);

router.get("/all", verifyVendorToken, getAllVendors);

export default router;