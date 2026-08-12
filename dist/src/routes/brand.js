import { Router } from "express";
import { createBrand, getBrands, getBrandById, updateBrand, deleteBrand, } from "../controllers/brand.js";
import { upload } from "../middleware/upload.js";
import { verifyToken } from "../middleware/middleware.js";
const router = Router();
router.post("/", verifyToken, upload.single("image"), createBrand);
router.get("/", getBrands);
router.get("/:id", getBrandById);
router.put("/:id", verifyToken, upload.single("image"), updateBrand);
router.delete("/:id", verifyToken, deleteBrand);
export default router;
//# sourceMappingURL=brand.js.map