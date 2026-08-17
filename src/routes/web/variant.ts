import { Router } from "express";
import {
  createVariant,
  getVariants,
  getVariantById,
  updateVariant,
  deleteVariant,
} from "../../controllers/variant.js";


const router = Router();

// ✅ Sirf Admin create/edit/delete kar sakta hai


// ✅ Admin, Branch, Employee sab dropdown/list ke liye dekh sakte hain
router.get("/",  getVariants);

router.get("/:id",  getVariantById);

;

export default router;