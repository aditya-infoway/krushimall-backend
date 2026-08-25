// src/routes/vendor/vendorBrand.ts

import { Router } from "express";
import { getPublicVendorBrands } from "../../controllers/vendor/vendorBrand.js";
import { verifyVendorToken } from "../../middleware/verifyVendorToken.js";


const router = Router();
router.get("/", verifyVendorToken, getPublicVendorBrands); 

export default router;