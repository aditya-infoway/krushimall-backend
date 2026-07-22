import { Router } from "express";
import websiteVariantRoutes from "./websiteVariant.js";
import websiteEnquiryRoutes from "./websiteEnquiry.js";
import websiteEnquiryFollowupRoutes from "./websiteEnquiryFollowup.js";

const router = Router();

router.use("/website-variant", websiteVariantRoutes);
router.use("/website-enquiry", websiteEnquiryRoutes);
router.use("/website-enquiry-followup", websiteEnquiryFollowupRoutes);


export default router;