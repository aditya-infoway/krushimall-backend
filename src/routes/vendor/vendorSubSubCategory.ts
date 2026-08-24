import { Router } from "express";
import {
  createVendorSubSubCategory,
  getVendorSubSubCategories,
  getPublicVendorSubSubCategories,
  getVendorSubSubCategoryById,
  updateVendorSubSubCategory,
  deleteVendorSubSubCategory,
} from "../../controllers/vendor/vendorSubSubCategory.js";
import { verifyVendorToken } from "../../middleware/verifyVendorAdminToken.js";
import { upload } from "../../middleware/upload.js";

const router = Router();

router.post("/", verifyVendorToken, upload.single("image"), createVendorSubSubCategory);
router.get("/", verifyVendorToken, getVendorSubSubCategories);
router.get("/public/list", getPublicVendorSubSubCategories);
router.get("/:id", getVendorSubSubCategoryById);
router.put("/:id", verifyVendorToken, upload.single("image"), updateVendorSubSubCategory);
router.delete("/:id", verifyVendorToken, deleteVendorSubSubCategory);

export default router;