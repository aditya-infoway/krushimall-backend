import { Router } from "express";

import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.post(
  "/",
  upload.single("image"),
  createCategory
);

router.post("/", createCategory);

router.get("/", getCategories);

router.get("/:id", getCategoryById);

router.put(
  "/:id",
  upload.single("image"),
  updateCategory
);

router.delete("/:id", deleteCategory);

export default router;