import { Router } from "express";
import {
getPublicVendorSubCategories
} from "../../controllers/venodr-admin/vendorSubCategory.js";
import { verifyVendorToken } from "../../middleware/verifyVendorToken.js";;


const router = Router();


router.get("/",verifyVendorToken, getPublicVendorSubCategories)

export default router;