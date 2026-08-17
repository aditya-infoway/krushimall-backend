import { Router } from "express";
import {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from "../../controllers/brand.js";


const router = Router();


router.get("/",  getBrands);

router.get("/:id",  getBrandById);



export default router;