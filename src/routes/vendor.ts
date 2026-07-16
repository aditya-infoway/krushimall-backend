// src/routes/vendor.ts

import { Router } from "express";
import {
  becomeVendor,
  getVendorData,
  updateVendor,
  updateVendorPassword,
  verifyVendor,
  getAllVendors
} from "../controllers/vendor.js";


const router = Router();

// Protected routes (require authentication)
router.post("/become", becomeVendor);
router.get("/me", getVendorData);
router.put("/update",  updateVendor);
router.put("/update-password",  updateVendorPassword);

// Admin routes (you can add admin middleware here)
router.put("/verify/:vendorId", verifyVendor);
router.get("/all", getAllVendors);

export default router;