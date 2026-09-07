// src/routes/vendor/vendorCategory.ts

import { Router } from "express";
import {

  getPublicVendorBrands

} from "../../controllers/vendor/vendorBrand.js";


const router = Router();


router.get("/", getPublicVendorBrands);

export default router;