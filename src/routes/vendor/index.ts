import { Router } from "express";
import websiteVariantRoutes from "./websiteVariant.js";
import websiteEnquiryRoutes from "./websiteEnquiry.js";
import websiteEnquiryFollowupRoutes from "./websiteEnquiryFollowup.js";
import usedWebsiteVariantRoutes from "./usedwebsiteVariant.js";
import vendorCategoryRoutes from "./vendorCategory.js";
import vendorBrandRoutes from "./vendorBrand.js";
import vendorSubCategoryRoutes from "./vendorSubCategory.js";

import vendorSubSubCategoryRoutes from "./vendorSubSubCategory.js";
import  EquipmentVariantRoutes  from "./equipmentVariant.js";
import equipmentEnquiryRoutes from "./equipmentEnquiry.js";
import equipmentEnquiryFollowupRoutes from "./equipmentEnquiryFollowup.js"

const router = Router();

router.use("/website-variant", websiteVariantRoutes);
router.use("/website-enquiry", websiteEnquiryRoutes);
router.use("/website-enquiry-followup", websiteEnquiryFollowupRoutes);
router.use("/used-website-variant", usedWebsiteVariantRoutes);
router.use("/category", vendorCategoryRoutes);
router.use("/brand", vendorBrandRoutes);
router.use("/subcategory", vendorSubCategoryRoutes);
router.use("/subsubcategory", vendorSubSubCategoryRoutes);
router.use("/equipmentvariant", EquipmentVariantRoutes);
router.use("/equipmentenquiry", equipmentEnquiryRoutes);
router.use("/equipmentenquiryfollowup", equipmentEnquiryFollowupRoutes);

export default router; 