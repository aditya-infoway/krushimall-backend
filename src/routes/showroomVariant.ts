import express from "express";

import {
  createShowroomVariant,
  getShowroomVariants,
  getShowroomVariantById,
  updateShowroomVariant,
  deleteShowroomVariant,
} from "../controllers/showroomVariant.js";
import { verifyToken } from "../middleware/middleware.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";

const router = express.Router();

// ✅ Sirf Admin create/edit/delete kar sakta hai
router.post("/", verifyToken, createShowroomVariant);

// ✅ Admin, Branch, Employee sab dekh sakte hain
// (LeadDetailsModal.tsx isse fetchShowroomVariants() se hi call karta hai)
router.get("/", verifyAnyToken, getShowroomVariants);

router.get("/:id", verifyAnyToken, getShowroomVariantById);

router.put("/:id", verifyToken, updateShowroomVariant);

router.delete("/:id", verifyToken, deleteShowroomVariant);

export default router;