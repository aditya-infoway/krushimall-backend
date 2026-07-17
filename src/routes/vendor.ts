// // src/routes/vendor.ts
// import { verifyToken } from "../middleware/middleware.js";
// import { Router } from "express";
// import {
//   becomeVendor,
//   getVendorData,
//   updateVendor,
//   updateVendorPassword,
//   verifyVendor,
//   getAllVendors,
//   // vendorLogin
// } from "../controllers/vendor.js";


// const router = Router();

// // Protected routes (require authentication)
// router.post("/become", verifyToken, becomeVendor);
// // router.post("/login", vendorLogin);

// router.get("/me", getVendorData);
// router.put("/update",  updateVendor);
// router.put("/update-password",  updateVendorPassword);

// // Admin routes (you can add admin middleware here)
// router.put("/verify/:vendorId", verifyVendor);
// router.get("/all", getAllVendors);

// export default router;



// src/routes/vendor.ts

import { Router } from "express";
import {
  becomeVendor,
  getVendorData,
  updateVendor,
  updateVendorPassword,
  verifyVendor,
  getAllVendors,
  vendorLogin,
} from "../controllers/vendor.js";
import { verifyWebToken } from "../middleware/verifyWebToken.js";

const router = Router();

// Public
router.post("/login", vendorLogin);

// Protected — require a logged-in web user's token
router.post("/become", verifyWebToken, becomeVendor);
router.get("/me", verifyWebToken, getVendorData);
router.put("/update", verifyWebToken, updateVendor);
router.put("/update-password", verifyWebToken, updateVendorPassword);

// Admin routes — TODO: swap in your existing admin/branch verifyToken
// middleware here. These are still wide open right now.
router.put("/verify/:vendorId",verifyWebToken, verifyVendor);
router.get("/all", verifyWebToken, getAllVendors);

export default router;