import { Router } from "express";
import { becomeVendor, verifyVendorOTP, resendVendorOTP, getVendorData, updateVendor, updateVendorPassword, verifyVendor, getAllVendors, vendorLogin, } from "../controllers/vendor.js";
import { verifyWebToken } from "../middleware/verifyWebToken.js";
import { verifyVendorToken } from "../middleware/verifyVendorToken.js";
import { upload } from "../middleware/upload.js";
const router = Router();
// =========================
// Public
// =========================
router.post("/login", vendorLogin);
// OTP verification happens before the vendor is logged in, so these
// stay public — identified by email+otp, same as /webauth/verify-otp
// and /webauth/resend-otp.
router.post("/verify-otp", verifyVendorOTP);
router.post("/resend-otp", resendVendorOTP);
// =========================
// Website User
// =========================
// User is logged into the website and wants to become a vendor
router.post("/become", verifyWebToken, becomeVendor);
// =========================
// Vendor Dashboard
// =========================
router.get("/me", verifyVendorToken, getVendorData);
router.put("/update", verifyVendorToken, upload.single("avatar"), updateVendor);
router.put("/update-password", verifyVendorToken, updateVendorPassword);
// =========================
// Admin
// =========================
// Later these should use your admin verifyToken middleware,
// not verifyVendorToken.
router.put("/verify/:vendorId", verifyVendorToken, verifyVendor);
router.get("/all", verifyVendorToken, getAllVendors);
export default router;
//# sourceMappingURL=vendor.js.map