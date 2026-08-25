import { Router } from "express";
import {
getPublicVendorSubCategories
} from "../../controllers/vendor/vendorSubCategory.js";
import { verifyVendorToken } from "../../middleware/verifyVendorToken.js";;


const router = Router();


router.get("/",verifyVendorToken, getPublicVendorSubCategories)

export default router;