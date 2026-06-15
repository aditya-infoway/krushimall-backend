import { Router } from "express";
import {
  createModel,
  getModels,
  getModelById,
  updateModel,
  deleteModel,
} from "../controllers/model.js";

import { upload } from "../middleware/upload.js";

const router = Router();

router.post(
  "/",
  upload.single("image"),
  createModel
);

router.get("/", getModels);

router.get("/:id", getModelById);

router.put(
  "/:id",
  upload.single("image"),
  updateModel
);

router.delete("/:id", deleteModel);

export default router;