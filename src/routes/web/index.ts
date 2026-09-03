import { Router } from "express";

import brandRoutes from "./brand.js";
import categoryRoutes from "./category.js";
import colourRoutes from "./colour.js";
import modelRoutes from "./model.js";
import modelYearRoutes from "./modelyear.js";
import showroomVariantRoutes from "./showroomVariant.js";
import variantRoutes from "./variant.js";
import  VendorCategoryRoutes from "./vendorCategory.js";
import VendorsubCategoryRoutes from "./vendorSubCategory.js"
import VendorsubsubCategoryRoutes from "./vendorSubSubCategory.js"
import productRoutes from "./product.js"
import cartRoutes from "./cart.js"
import orderRoutes from "./order.js"
import couponRoutes from "./../web/coupon.js";
const router = Router();

router.use("/brands", brandRoutes);
router.use("/categories", categoryRoutes);
router.use("/colours", colourRoutes);
router.use("/models", modelRoutes);
router.use("/model-years", modelYearRoutes);
router.use("/showroom-variants", showroomVariantRoutes);
router.use("/variants", variantRoutes);
router.use("/VendorCategory", VendorCategoryRoutes);
router.use("/VendorsubCategory", VendorsubCategoryRoutes);
router.use("/Vendorsub-subCategory", VendorsubsubCategoryRoutes);
router.use("/product", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/coupons", couponRoutes);
export default router;