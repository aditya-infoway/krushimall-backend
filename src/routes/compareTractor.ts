import { Router } from "express";
import {
  getCompareBrands,
  getCompareModels,
  getCompareVariants,
  getCompareVariantDetails,
  getTrendingTractors,
  getTrendingUsedTractors,
  getCompareUsedVariantDetails,
  getCompareUsedVariants
} from "../controllers/compareTractor.js";

const router = Router();

router.get("/brands", getCompareBrands);

router.get("/brands/:brandId/models", getCompareModels);

router.get("/models/:modelId/variants", getCompareVariants);

router.get("/variant/:variantId", getCompareVariantDetails);

router.get("/trending", getTrendingTractors);

router.get("/used-trending", getTrendingUsedTractors);
router.get("/used-variant/:variantId", getCompareUsedVariantDetails);
router.get("/models/:modelId/used-variants", getCompareUsedVariants);
export default router;