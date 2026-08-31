import express from "express";

import {
  createShowroomVariant,
  getShowroomVariants,
  getShowroomVariantById,
  updateShowroomVariant,
  deleteShowroomVariant,
} from "../../controllers/showroomVariant.js";


const router = express.Router();


router.get("/",  getShowroomVariants);

router.get("/:id",  getShowroomVariantById);



export default router;