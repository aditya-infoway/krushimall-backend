import { Router } from "express";
import {
  createImplementCategory,
  getImplementCategories,
  getImplementCategoryById,
  updateImplementCategory,
  deleteImplementCategory,
} from "../controllers/implementCategory.js";
import { verifyToken } from "../middleware/middleware.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";

const router = Router();

router.post("/", verifyToken, createImplementCategory);
router.get("/", verifyAnyToken, getImplementCategories);
router.get("/:id", verifyAnyToken, getImplementCategoryById);
router.put("/:id", verifyToken, updateImplementCategory);
router.delete("/:id", verifyToken, deleteImplementCategory);

export default router;
