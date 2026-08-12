import { Router } from "express";
import * as UsedWebsiteVariantController from "../../controllers/vendor/usedwebsiteVariant.js";
import { verifyVendorToken } from "../../middleware/verifyVendorToken.js";
import { upload } from "../../middleware/upload.js";
import { getBestValueUsedWebsiteVariants } from "../../controllers/vendor/usedwebsiteVariant.js";
import { getPublicUsedWebsiteVariantById } from "../../controllers/vendor/usedwebsiteVariant.js";
const router = Router();
;
const mediaUpload = upload.fields([
    { name: "frontView", maxCount: 1 },
    { name: "leftView", maxCount: 1 },
    { name: "rightView", maxCount: 1 },
    { name: "rearView", maxCount: 1 },
    { name: "engineView", maxCount: 1 },
    { name: "dashboardView", maxCount: 1 },
    { name: "tyreView", maxCount: 1 },
    { name: "hydraulicView", maxCount: 1 },
    { name: "ptoView", maxCount: 1 },
    // Image of chassis number
    { name: "chassisNumberImage", maxCount: 1 },
    { name: "rcBook", maxCount: 1 },
    { name: "additionalImage1", maxCount: 1 },
    { name: "additionalImage2", maxCount: 1 },
    { name: "additionalImage3", maxCount: 1 },
    { name: "additionalImage4", maxCount: 1 },
    { name: "additionalImage5", maxCount: 1 },
    { name: "brochure", maxCount: 1 },
    { name: "warrantyCard", maxCount: 1 },
    { name: "insuranceCertificate", maxCount: 1 },
    { name: "invoice", maxCount: 1 },
    { name: "others", maxCount: 1 },
]);
// Create
router.post("/", verifyVendorToken, mediaUpload, UsedWebsiteVariantController.createUsedWebsiteVariant);
// List
router.get("/", verifyVendorToken, UsedWebsiteVariantController.getUsedWebsiteVariants);
router.get("/latest", UsedWebsiteVariantController.getLatestUsedWebsiteVariants);
router.get("/popular", UsedWebsiteVariantController.getPopularUsedWebsiteVariants);
router.get("/best-value", getBestValueUsedWebsiteVariants);
router.get("/public", UsedWebsiteVariantController.getPublicUsedWebsiteVariants);
// Public — storefront detail page. No auth, ACTIVE listings only.
// Two segments ("/public/:id"), so no clash with the vendor-only "/:id" below.
router.get("/public/:id", getPublicUsedWebsiteVariantById);
// Get By Id (vendor dashboard — vendor's OWN listings only, any status)
router.get("/:id", verifyVendorToken, UsedWebsiteVariantController.getUsedWebsiteVariantById);
// Update
router.put("/:id", verifyVendorToken, upload.any(), UsedWebsiteVariantController.updateUsedWebsiteVariant);
// Save Step
router.put("/:id/save-step", verifyVendorToken, mediaUpload, UsedWebsiteVariantController.saveStep);
// Submit
router.put("/:id/submit", verifyVendorToken, UsedWebsiteVariantController.submitUsedWebsiteVariant);
// Delete
router.delete("/:id", verifyVendorToken, UsedWebsiteVariantController.deleteUsedWebsiteVariant);
export default router;
//# sourceMappingURL=usedwebsiteVariant.js.map