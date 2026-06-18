import { Router } from "express";
import {
createWebsiteVariant,
getWebsiteVariants,
getWebsiteVariantById,
updateWebsiteVariant,
saveStep,
submitWebsiteVariant,
deleteWebsiteVariant,
} from "../controllers/websiteVariant.js";

import { upload } from "../middleware/upload.js";

const router = Router();

const mediaUpload = upload.fields([
// Images
{ name: "frontView", maxCount: 1 },
{ name: "leftView", maxCount: 1 },
{ name: "rightView", maxCount: 1 },
{ name: "rearView", maxCount: 1 },

{ name: "engineView", maxCount: 1 },
{ name: "dashboardView", maxCount: 1 },
{ name: "tyreView", maxCount: 1 },
{ name: "hydraulicView", maxCount: 1 },
{ name: "ptoView", maxCount: 1 },

{ name: "chassisNumber", maxCount: 1 },
{ name: "rcBook", maxCount: 1 },

{ name: "additionalImage1", maxCount: 1 },
{ name: "additionalImage2", maxCount: 1 },
{ name: "additionalImage3", maxCount: 1 },
{ name: "additionalImage4", maxCount: 1 },
{ name: "additionalImage5", maxCount: 1 },

// Documents
{ name: "brochure", maxCount: 1 },
{ name: "warrantyCard", maxCount: 1 },
{ name: "insuranceCertificate", maxCount: 1 },
{ name: "invoice", maxCount: 1 },
{ name: "others", maxCount: 1 },
]);

// Create
router.post(
"/",
mediaUpload,
createWebsiteVariant
);

// Get All
router.get(
"/",
getWebsiteVariants
);

// Get By Id
router.get(
"/:id",
getWebsiteVariantById
);

// Update Full Record
router.put(
"/:id",
mediaUpload,
updateWebsiteVariant
);

// Save Step
router.put(
"/:id/save-step",
mediaUpload,
saveStep
);

// Final Submit
router.put(
"/:id/submit",
submitWebsiteVariant
);

// Delete
router.delete(
"/:id",
deleteWebsiteVariant
);

export default router;
