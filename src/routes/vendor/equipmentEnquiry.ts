import { Router } from "express";

import * as EquipmentEnquiryController from "../../controllers/vendor/equipmentEnquiry.js";

import { verifyVendorToken } from "../../middleware/verifyVendorToken.js";

const router = Router();

// Public - Create Enquiry
router.post("/", EquipmentEnquiryController.createEquipmentEnquiry);

// Vendor Panel - Get All
router.get(
  "/",
  verifyVendorToken,
  EquipmentEnquiryController.getEquipmentEnquiries,
);

// Vendor Panel - Get Single
router.get(
  "/:id",
  verifyVendorToken,
  EquipmentEnquiryController.getEquipmentEnquiry,
);

// Vendor Panel - Update
router.put(
  "/:id",
  verifyVendorToken,
  EquipmentEnquiryController.updateEquipmentEnquiry,
);

// Vendor Panel - Delete
router.delete(
  "/:id",
  verifyVendorToken,
  EquipmentEnquiryController.deleteEquipmentEnquiry,
);

export default router;
