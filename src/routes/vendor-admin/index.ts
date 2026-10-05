import { Router } from "express";

import vendorCategoryRoutes from "../vendor-admin/vendorCategory.js";
import vendorBrandRoutes from "../vendor-admin/vendorBrand.js";
import vendorSubCategoryRoutes from "../vendor-admin/vendorSubCategory.js";

import vendorSubSubCategoryRoutes from "../vendor-admin/vendorSubSubCategory.js";
import websiteVariantRoutes from "./websiteVariant.js";
const router = Router();


router.use("/category", vendorCategoryRoutes);
router.use("/brand", vendorBrandRoutes);
router.use("/subcategory", vendorSubCategoryRoutes);
router.use("/subsubcategory", vendorSubSubCategoryRoutes);
router.use("/website-variants", websiteVariantRoutes);

export default router; 