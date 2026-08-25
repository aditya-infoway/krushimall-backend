// src/routes/web/product.ts

import { Router } from "express";
import {
  getPublicProducts,
  getPublicProductById,
} from "../../controllers/vendor-panel/product.js";

const router = Router();

router.get("/", getPublicProducts);
router.get("/:id", getPublicProductById);

export default router;