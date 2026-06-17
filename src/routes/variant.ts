import { Router } from "express";
import {
  createVariant,
  getVariants,
  getVariantById,
  updateVariant,
  deleteVariant,
} from "../controllers/variant.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.post(
  "/",
  upload.single("image"),
  createVariant
);

router.get("/", getVariants);

router.get("/:id", getVariantById);

router.put(
  "/:id",
  upload.single("image"),
  updateVariant
);

router.delete("/:id", deleteVariant);

export default router;