// src/routes/vendor/vendorProduct.ts

import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../../controllers/vendor-panel/product.js";

import { verifyVendorToken } from "../../middleware/verifyVendorToken.js";
import { upload } from "../../middleware/upload.js";

const router = Router();

router.post(
  "/",
  verifyVendorToken,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "thumbnailImage", maxCount: 1 },
    { name: "additionalImages", maxCount: 5 },
  ]),
  createProduct,
);

router.get("/", verifyVendorToken, getProducts);

router.get("/:id", verifyVendorToken, getProductById);

router.put(
  "/:id",
  verifyVendorToken,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "thumbnailImage", maxCount: 1 },
    { name: "additionalImages", maxCount: 5 },
  ]),
  updateProduct,
);

router.delete("/:id", verifyVendorToken, deleteProduct);

export default router;