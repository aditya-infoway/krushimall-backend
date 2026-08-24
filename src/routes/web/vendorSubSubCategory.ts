import { Router } from "express";
import {
 
  getPublicVendorSubSubCategories,

} from "../../controllers/vendor/vendorSubSubCategory.js";


const router = Router();

router.get("/", getPublicVendorSubSubCategories);

export default router;