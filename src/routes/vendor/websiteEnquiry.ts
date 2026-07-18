import { Router } from "express";
import * as WebsiteEnquiryController from "../../controllers/vendor/websiteEnquiry.js";
import { verifyVendorToken } from "../../middleware/verifyVendorToken.js";

const router = Router();

// Website (Public)
router.post("/", WebsiteEnquiryController.createWebsiteEnquiry);

// Vendor Panel
router.get("/", verifyVendorToken, WebsiteEnquiryController.getWebsiteEnquiries);
router.get("/:id", verifyVendorToken, WebsiteEnquiryController.getWebsiteEnquiry);
router.put("/:id/status", verifyVendorToken, WebsiteEnquiryController.updateStatus);

export default router;