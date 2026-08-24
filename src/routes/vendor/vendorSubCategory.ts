import { Router } from "express";
import {
  createVendorSubCategory,
  getVendorSubCategories,
  getVendorSubCategoryById,
  updateVendorSubCategory,
  deleteVendorSubCategory,
} from "../../controllers/vendor/vendorSubCategory.js";
import { verifyVendorToken } from "../../middleware/verifyVendorAdminToken.js";
import { upload } from "../../middleware/upload.js";

const router = Router();

router.post("/", verifyVendorToken, upload.single("image"), createVendorSubCategory);
router.get("/",verifyVendorToken, getVendorSubCategories);
router.get("/:id",verifyVendorToken, getVendorSubCategoryById);
router.put("/:id", verifyVendorToken, upload.single("image"), updateVendorSubCategory);
router.delete("/:id", verifyVendorToken, deleteVendorSubCategory);

export default router;