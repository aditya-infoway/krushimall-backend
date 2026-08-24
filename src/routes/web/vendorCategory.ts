// src/routes/vendor/vendorCategory.ts

import { Router } from "express";
import {

  getPublicVendorCategories

} from "../../controllers/vendor/vendorCategory.js";


const router = Router();


router.get("/", getPublicVendorCategories);

export default router;