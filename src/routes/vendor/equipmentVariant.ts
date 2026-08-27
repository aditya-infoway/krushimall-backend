import { Router } from "express";

import * as EquipmentVariantController from "../../controllers/vendor/equipmentVariant.js";

import { verifyVendorToken } from "../../middleware/verifyVendorToken.js";

import { upload } from "../../middleware/upload.js";

const router = Router();

// ============================================================
// MEDIA UPLOAD
// ============================================================

const mediaUpload = upload.fields([
  // ==========================
  // Images
  // ==========================
  { name: "frontView", maxCount: 1 },
  { name: "leftView", maxCount: 1 },
  { name: "rightView", maxCount: 1 },
  { name: "rearView", maxCount: 1 },
  { name: "mainEquipment", maxCount: 1 },
  { name: "workingMechanism", maxCount: 1 },
  { name: "controlPanel", maxCount: 1 },
  { name: "serialNumberImage", maxCount: 1 },
  { name: "attachmentsImage", maxCount: 1 },
  { name: "tyresWheels", maxCount: 1 },

  // ==========================
  // Videos
  // ==========================
  { name: "walkaroundVideo", maxCount: 1 },
  { name: "workingVideo", maxCount: 1 },
  { name: "machineStartVideo", maxCount: 1 },
  { name: "ptoWorkingVideo", maxCount: 1 },
  { name: "hydraulicWorkingVideo", maxCount: 1 },

  // ==========================
  // Documents
  // ==========================
  { name: "purchaseInvoice", maxCount: 1 },
  { name: "ownershipProof", maxCount: 1 },
  { name: "warrantyDocument", maxCount: 1 },
  { name: "insurance", maxCount: 1 },
  { name: "serviceRecords", maxCount: 1 },
  { name: "otherDocuments", maxCount: 1 },
]);

// ============================================================
// CREATE
// ============================================================

router.post(
  "/",
  verifyVendorToken,
  mediaUpload,
  EquipmentVariantController.createEquipmentVariant,
);

// ============================================================
// LIST - VENDOR
// ============================================================

router.get(
  "/",
  verifyVendorToken,
  EquipmentVariantController.getEquipmentVariants,
);

// ============================================================
// LATEST
// ============================================================

router.get(
  "/latest",
  EquipmentVariantController.getLatestEquipmentVariants,
);

// ============================================================
// POPULAR
// ============================================================

router.get(
  "/popular",
  EquipmentVariantController.getPopularEquipmentVariants,
);

// ============================================================
// BEST VALUE
// ============================================================

router.get(
  "/best-value",
  EquipmentVariantController.getBestValueEquipmentVariants,
);

// ============================================================
// PUBLIC LIST
// ============================================================

router.get(
  "/public",
  EquipmentVariantController.getPublicEquipmentVariants,
);

// ============================================================
// PUBLIC DETAIL
// No authentication
// ACTIVE listings only
// ============================================================

router.get(
  "/public/:id",
  EquipmentVariantController.getPublicEquipmentVariantById,
);

// ============================================================
// GET BY ID
// Vendor dashboard
// Vendor's own listings only
// ============================================================

router.get(
  "/:id",
  verifyVendorToken,
  EquipmentVariantController.getEquipmentVariantById,
);

// ============================================================
// UPDATE
// ============================================================

router.put(
  "/:id",
  verifyVendorToken,
  upload.any(),
  EquipmentVariantController.updateEquipmentVariant,
);

// ============================================================
// SAVE STEP
// ============================================================

router.put(
  "/:id/save-step",
  verifyVendorToken,
  mediaUpload,
  EquipmentVariantController.saveStep,
);

// ============================================================
// SUBMIT
// ============================================================

router.put(
  "/:id/submit",
  verifyVendorToken,
  EquipmentVariantController.submitEquipmentVariant,
);

// ============================================================
// DELETE
// ============================================================

router.delete(
  "/:id",
  verifyVendorToken,
  EquipmentVariantController.deleteEquipmentVariant,
);

export default router;