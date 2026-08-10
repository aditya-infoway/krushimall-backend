import express from "express";

import {
  createShowroomVariant,
  getShowroomVariants,
  getShowroomVariantById,
  updateShowroomVariant,
  deleteShowroomVariant,
} from "../controllers/showroomVariant.js";
import { verifyToken } from "../middleware/middleware.js";
const router = express.Router();

router.post("/",   verifyToken, createShowroomVariant);

router.get("/",    getShowroomVariants);

router.get("/:id",    getShowroomVariantById);

router.put("/:id",   verifyToken, updateShowroomVariant);

router.delete("/:id",   verifyToken, deleteShowroomVariant);

export default router;