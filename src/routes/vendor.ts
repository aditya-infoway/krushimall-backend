import { Router } from "express";

import {
  becomeVendor,
  verifyVendorOTP,
  resendVendorOTP,
  getVendorData,
  updateVendor,
  updateVendorPassword,
  verifyVendor,
  getAllVendors,
  vendorLogin,
  vendorPanelLogin,
  updateVendorStatus,
} from "../controllers/vendor.js";

import { verifyWebToken } from "../middleware/verifyWebToken.js";
import { verifyVendorToken } from "../middleware/verifyVendorToken.js";
import { upload } from "../middleware/upload.js";

const router = Router();


router.post("/login", vendorLogin);


router.post("/panel-login", vendorPanelLogin);

router.post("/verify-otp", verifyVendorOTP);

router.post("/resend-otp", resendVendorOTP);


router.post(
  "/become",
  verifyWebToken,
  becomeVendor,
);



router.get(
  "/me",
  verifyVendorToken,
  getVendorData,
);

router.put(
  "/update",
  verifyVendorToken,
  upload.single("avatar"),
  updateVendor,
);

router.put(
  "/update-password",
  verifyVendorToken,
  updateVendorPassword,
);


router.put(
  "/verify/:vendorId",
  verifyVendorToken,
  verifyVendor,
);


router.get(
  "/all",
  getAllVendors,
);


router.patch(
  "/:vendorId/status",

  updateVendorStatus,
);

export default router;