// src/routes/vendor/vendorCategory.ts

import { Router } from "express";
import {

  getPublicVendorBrands

} from "../../controllers/venodr-admin/vendorBrand.js";


const router = Router();


router.get("/", getPublicVendorBrands);

export default router;