import { Router } from "express";

import productRoutes from "../vendor-panel/product.js"
import vendorCategoryRoutes from "./vendorCategory.js";
import vendorBrandRoutes from "./vendorBrand.js";
import vendorSubCategoryRoutes from "./vendorSubCategory.js";

import vendorSubSubCategoryRoutes from "./vendorSubSubCategory.js";
import vendororderRoutes from "./vendorOrder.js"
import coupanRoutes from "./coupan.js"
const router = Router();

router.use("/product", productRoutes);
router.use("/category", vendorCategoryRoutes);
router.use("/brand", vendorBrandRoutes);
router.use("/subcategory", vendorSubCategoryRoutes);
router.use("/subsubcategory", vendorSubSubCategoryRoutes);
router.use("/orders", vendororderRoutes);
router.use("/coupons", coupanRoutes);
export default router;