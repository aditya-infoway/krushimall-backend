// src/routes/vendor/vendorCategory.ts

import { Router } from "express";
import {
  createVendorCategory,
  getVendorCategories,
  getVendorCategoryById,
  updateVendorCategory,
  deleteVendorCategory,
} from "../../controllers/vendor/vendorCategory.js";
import { verifyVendorToken } from "../../middleware/verifyVendorAdminToken.js";
import { upload } from "../../middleware/upload.js";

const router = Router();

router.post("/",verifyVendorToken,  upload.single("image"), createVendorCategory);
router.get("/",verifyVendorToken,  getVendorCategories);
router.get("/:id",verifyVendorToken,  getVendorCategoryById);
router.put("/:id",verifyVendorToken,  upload.single("image"), updateVendorCategory);
router.delete("/:id",verifyVendorToken,  deleteVendorCategory);

export default router;