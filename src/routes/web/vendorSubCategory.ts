import { Router } from "express";
import {
getPublicVendorSubCategories
} from "../../controllers/vendor/vendorSubCategory.js";


const router = Router();

router.get("/", getPublicVendorSubCategories); 

export default router;