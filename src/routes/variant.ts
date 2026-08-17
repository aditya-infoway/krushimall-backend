import { Router } from "express";
import {
  createVariant,
  getVariants,
  getVariantById,
  updateVariant,
  deleteVariant,
} from "../controllers/variant.js";
import { upload } from "../middleware/upload.js";
import { verifyToken } from "../middleware/middleware.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";

const router = Router();

// ✅ Sirf Admin create/edit/delete kar sakta hai
router.post("/", verifyToken, upload.single("image"), createVariant);

// ✅ Admin, Branch, Employee sab dropdown/list ke liye dekh sakte hain
router.get("/", verifyAnyToken, getVariants);

router.get("/:id", verifyAnyToken, getVariantById);

router.put("/:id", verifyToken, upload.single("image"), updateVariant);

router.delete("/:id", verifyToken, deleteVariant);

export default router;