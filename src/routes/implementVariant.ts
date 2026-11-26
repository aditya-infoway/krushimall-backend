import { Router } from "express";
import {
  createImplementVariant,
  getImplementVariants,
  getImplementVariantById,
  updateImplementVariant,
  deleteImplementVariant,
} from "../controllers/implementVariant.js";
import { verifyToken } from "../middleware/middleware.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";

const router = Router();

router.post("/", verifyToken, createImplementVariant);
router.get("/", verifyAnyToken, getImplementVariants);
router.get("/:id", verifyAnyToken, getImplementVariantById);
router.put("/:id", verifyToken, updateImplementVariant);
router.delete("/:id", verifyToken, deleteImplementVariant);

export default router;
