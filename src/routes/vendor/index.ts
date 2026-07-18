import { Router } from "express";
import websiteVariantRoutes from "./websiteVariant.js";
import websiteEnquiryRoutes from "./websiteEnquiry.js";

const router = Router();

router.use("/website-variant", websiteVariantRoutes);
router.use("/website-enquiry", websiteEnquiryRoutes);

export default router;