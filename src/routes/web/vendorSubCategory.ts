import { Router } from "express";
import {
getPublicVendorSubCategories
} from "../../controllers/venodr-admin/vendorSubCategory.js";


const router = Router();

router.get("/", getPublicVendorSubCategories); 

export default router;