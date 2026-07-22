import { Router } from "express";
import {
  getCompareBrands,
  getCompareModels,
  getCompareVariants,
  getCompareVariantDetails,
  getTrendingTractors,
} from "../controllers/compareTractor.js";

const router = Router();

router.get("/brands", getCompareBrands);

router.get("/brands/:brandId/models", getCompareModels);

router.get("/models/:modelId/variants", getCompareVariants);

router.get("/variant/:variantId", getCompareVariantDetails);

router.get("/trending", getTrendingTractors);

export default router;
