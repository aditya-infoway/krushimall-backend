// src/routes/vendor/websiteEnquiryFollowup.ts
import { Router } from "express";
import * as WebsiteEnquiryFollowupController from "../../controllers/vendor/websiteEnquiryFollowup.js";
import { verifyVendorToken } from "../../middleware/verifyVendorToken.js";
const router = Router();
// Create Follow-up
router.post("/", verifyVendorToken, WebsiteEnquiryFollowupController.createFollowup);
// Get Follow-ups by Enquiry
router.get("/enquiry/:enquiryId", verifyVendorToken, WebsiteEnquiryFollowupController.getFollowupsByEnquiry);
router.get("/today", verifyVendorToken, WebsiteEnquiryFollowupController.getTodayFollowups);
// Update Follow-up
router.put("/:id", verifyVendorToken, WebsiteEnquiryFollowupController.updateFollowup);
// Delete Follow-up
router.delete("/:id", verifyVendorToken, WebsiteEnquiryFollowupController.deleteFollowup);
export default router;
//# sourceMappingURL=websiteEnquiryFollowup.js.map