import { Router } from "express";

import {
  createModelYear,
  getModelYears,
  getModelYearById,
  updateModelYear,
  deleteModelYear,
} from "../controllers/modelYear.js";

import { upload } from "../middleware/upload.js";
import { verifyToken } from "../middleware/middleware.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";

const router = Router();

router.post("/", verifyToken, upload.single("image"), createModelYear);

router.get("/", verifyAnyToken, getModelYears);

router.get("/:id", verifyAnyToken, getModelYearById);

router.put("/:id", verifyToken, upload.single("image"), updateModelYear);

router.delete("/:id", verifyToken, deleteModelYear);

export default router;