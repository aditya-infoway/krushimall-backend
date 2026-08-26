// src/routes/web/product.ts

import { Router } from "express";
import {
  getPublicProducts,
  getPublicProductById,
  getRelatedProducts
} from "../../controllers/vendor-panel/product.js";

const router = Router();

router.get("/", getPublicProducts);
router.get("/:id", getPublicProductById);
router.get("/:id/related", getRelatedProducts);
export default router;