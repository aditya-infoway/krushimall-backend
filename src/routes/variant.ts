import { Router } from "express";
import {
  createVariant,
  getVariants,
  getVariantById,
  updateVariant,
  deleteVariant,
} from "../controllers/variant.js";
import { upload } from "../middleware/upload.js";
import { verifyToken } from "../middleware/middleware.js";
const router = Router();

router.post(
  "/",
     verifyToken,
  upload.single("image"),
  createVariant
);

router.get("/",   verifyToken, getVariants);

router.get("/:id",   verifyToken, getVariantById);

router.put(
  "/:id",
     verifyToken,
  upload.single("image"),
  updateVariant
);

router.delete("/:id",   verifyToken, deleteVariant);

export default router;