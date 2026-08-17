import { Router } from "express";
import {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from "../controllers/brand.js";
import { upload } from "../middleware/upload.js";
import { verifyToken } from "../middleware/middleware.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";

const router = Router();

// ✅ Sirf Admin create/edit/delete kar sakta hai
router.post("/", verifyToken, upload.single("image"), createBrand);

// ✅ Admin, Branch, Employee sab list/detail dekh sakte hain
router.get("/", verifyAnyToken, getBrands);

router.get("/:id", verifyAnyToken, getBrandById);

router.put("/:id", verifyToken, upload.single("image"), updateBrand);

router.delete("/:id", verifyToken, deleteBrand);

export default router;