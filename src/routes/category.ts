import { Router } from "express";

import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.js";
import { upload } from "../middleware/upload.js";
import { verifyToken } from "../middleware/middleware.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";

const router = Router();

// ✅ Sirf Admin create/edit/delete kar sakta hai
router.post("/", verifyToken, upload.single("image"), createCategory);

// ✅ Admin, Branch, Employee sab list/detail dekh sakte hain
router.get("/", verifyAnyToken, getCategories);

router.get("/:id", verifyAnyToken, getCategoryById);

router.put("/:id", verifyToken, upload.single("image"), updateCategory);

router.delete("/:id", verifyToken, deleteCategory);

export default router;