// src/routes/vendor/vendorBrand.ts

import { Router } from "express";
import {
  createVendorBrand,
  getVendorBrands,
  getVendorBrandById,
  updateVendorBrand,
  deleteVendorBrand,
} from "../../controllers/vendor/vendorBrand.js";
import { verifyVendorToken } from "../../middleware/verifyVendorAdminToken.js";
import { upload } from "../../middleware/upload.js";

const router = Router();

router.post("/", verifyVendorToken, upload.single("image"), createVendorBrand);
router.get("/", verifyVendorToken, getVendorBrands);
router.get("/:id", verifyVendorToken, getVendorBrandById);
router.put("/:id", verifyVendorToken, upload.single("image"), updateVendorBrand);
router.delete("/:id", verifyVendorToken, deleteVendorBrand);

export default router;