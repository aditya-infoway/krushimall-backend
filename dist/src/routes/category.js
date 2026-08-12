import { Router } from "express";
import { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory, } from "../controllers/category.js";
import { upload } from "../middleware/upload.js";
import { verifyToken } from "../middleware/middleware.js";
const router = Router();
router.post("/", verifyToken, upload.single("image"), createCategory);
router.post("/", verifyToken, createCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.put("/:id", verifyToken, upload.single("image"), updateCategory);
router.delete("/:id", verifyToken, deleteCategory);
export default router;
//# sourceMappingURL=category.js.map