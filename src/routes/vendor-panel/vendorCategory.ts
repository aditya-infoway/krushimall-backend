// src/routes/vendor/vendorCategory.ts

import { Router } from "express";
import { getPublicVendorCategories, /* baaki existing */ } from "../../controllers/vendor/vendorCategory.js";
import { verifyVendorToken } from "../../middleware/verifyVendorToken.js";


const router = Router();



// ...
router.get("/", verifyVendorToken, getPublicVendorCategories); // pehle getVendorCategories tha


export default router;