import { Router } from "express";

import {
  createModelYear,
  getModelYears,
  getModelYearById,
  updateModelYear,
  deleteModelYear,
} from "../controllers/modelYear.js";

import { upload } from "../middleware/upload.js";

const router = Router();

router.post(
  "/",
  upload.single("image"),
  createModelYear
);

router.get(
  "/",
  getModelYears
);

router.get(
  "/:id",
  getModelYearById
);

router.put(
  "/:id",
  upload.single("image"),
  updateModelYear
);

router.delete(
  "/:id",
  deleteModelYear
);

export default router;