import express from "express";

import {
  createShowroomVariant,
  getShowroomVariants,
  getShowroomVariantById,
  updateShowroomVariant,
  deleteShowroomVariant,
} from "../controllers/showroomVariant.js";

const router = express.Router();

router.post("/", createShowroomVariant);

router.get("/", getShowroomVariants);

router.get("/:id", getShowroomVariantById);

router.put("/:id", updateShowroomVariant);

router.delete("/:id", deleteShowroomVariant);

export default router;