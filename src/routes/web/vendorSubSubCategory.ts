import { Router } from "express";
import {
 
  getPublicVendorSubSubCategories,

} from "../../controllers/venodr-admin/vendorSubSubCategory.js";


const router = Router();

router.get("/", getPublicVendorSubSubCategories);

export default router;