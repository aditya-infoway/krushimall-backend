import { Router } from "express";

import * as EquipmentEnquiryFollowupController from "../../controllers/vendor/equipmentEnquiryFollowup.js";

import { verifyVendorToken } from "../../middleware/verifyVendorToken.js";

const router = Router();

// ============================================================
// CREATE FOLLOW-UP
// ============================================================

router.post(
  "/",
  verifyVendorToken,
  EquipmentEnquiryFollowupController.createEquipmentEnquiryFollowup
);

// ============================================================
// GET FOLLOW-UPS BY ENQUIRY
// ============================================================

router.get(
  "/enquiry/:enquiryId",
  verifyVendorToken,
  EquipmentEnquiryFollowupController.getEquipmentEnquiryFollowups
);

// ============================================================
// GET TODAY FOLLOW-UPS
// ============================================================

router.get(
  "/today",
  verifyVendorToken,
  EquipmentEnquiryFollowupController.getTodayEquipmentFollowups
);

// ============================================================
// UPDATE FOLLOW-UP
// ============================================================

router.put(
  "/:id",
  verifyVendorToken,
  EquipmentEnquiryFollowupController.updateEquipmentEnquiryFollowup
);

// ============================================================
// DELETE FOLLOW-UP
// ============================================================

router.delete(
  "/:id",
  verifyVendorToken,
  EquipmentEnquiryFollowupController.deleteEquipmentEnquiryFollowup
);

export default router;