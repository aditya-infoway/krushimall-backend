import { Router } from "express";
import websiteVariantRoutes from "./websiteVariant.js";
import websiteEnquiryRoutes from "./websiteEnquiry.js";
import websiteEnquiryFollowupRoutes from "./websiteEnquiryFollowup.js";
import usedWebsiteVariantRoutes from "./usedwebsiteVariant.js";

import  EquipmentVariantRoutes  from "./equipmentVariant.js";
import equipmentEnquiryRoutes from "./equipmentEnquiry.js";
import equipmentEnquiryFollowupRoutes from "./equipmentEnquiryFollowup.js"

const router = Router();

router.use("/website-variant", websiteVariantRoutes);
router.use("/website-enquiry", websiteEnquiryRoutes);
router.use("/website-enquiry-followup", websiteEnquiryFollowupRoutes);
router.use("/used-website-variant", usedWebsiteVariantRoutes);

router.use("/equipmentvariant", EquipmentVariantRoutes);
router.use("/equipmentenquiry", equipmentEnquiryRoutes);
router.use("/equipmentenquiryfollowup", equipmentEnquiryFollowupRoutes);

export default router; 