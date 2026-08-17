import express from "express";

import {
  createShowroomVariant,
  getShowroomVariants,
  getShowroomVariantById,
  updateShowroomVariant,
  deleteShowroomVariant,
} from "../../controllers/showroomVariant.js";


const router = express.Router();

// ✅ Sirf Admin create/edit/delete kar sakta hai


// ✅ Admin, Branch, Employee sab dekh sakte hain
// (LeadDetailsModal.tsx isse fetchShowroomVariants() se hi call karta hai)
router.get("/",  getShowroomVariants);

router.get("/:id",  getShowroomVariantById);



export default router;