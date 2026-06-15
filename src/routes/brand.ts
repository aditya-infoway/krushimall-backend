import { Router } from "express";
import {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from "../controllers/brand.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.post(
  "/",
  upload.single("image"),
  createBrand
);

router.get("/", getBrands);

router.get("/:id", getBrandById);

router.put(
  "/:id",
  upload.single("image"),
  updateBrand
);

router.delete("/:id", deleteBrand);

export default router;