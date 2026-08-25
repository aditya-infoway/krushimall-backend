import { Router } from "express";
import {

  getPublicVendorSubSubCategories,

} from "../../controllers/vendor/vendorSubSubCategory.js";
import { verifyVendorToken } from "../../middleware/verifyVendorToken.js";;


const router = Router();



router.get("/",verifyVendorToken, getPublicVendorSubSubCategories);



export default router;