import { Router } from "express";
import * as WebsiteVariantController from "../../controllers/vendor/websiteVariant.js";
import { verifyVendorToken } from "../../middleware/verifyVendorToken.js";
import { upload } from "../../middleware/upload.js";

const router = Router();
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

  { name: "chassisNumber", maxCount: 1 },
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
router.post(
  "/",
  verifyVendorToken,
 mediaUpload,
  WebsiteVariantController.createWebsiteVariant
);

router.get(
  "/",
  verifyVendorToken,
  WebsiteVariantController.getWebsiteVariants
);

router.get(
  "/:id",
  verifyVendorToken,
  WebsiteVariantController.getWebsiteVariantById
);

router.put(
  "/:id",
  verifyVendorToken,
  upload.any(),
  WebsiteVariantController.updateWebsiteVariant
);

router.put(
  "/:id/save-step",
  verifyVendorToken,
  mediaUpload,
  WebsiteVariantController.saveStep
);

router.put(
  "/:id/submit",
  verifyVendorToken,
  WebsiteVariantController.submitWebsiteVariant
);

router.delete(
  "/:id",
  verifyVendorToken,
  WebsiteVariantController.deleteWebsiteVariant
);

export default router;