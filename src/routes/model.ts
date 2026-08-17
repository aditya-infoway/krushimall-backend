import { Router } from "express";
import {
  createModel,
  getModels,
  getModelById,
  updateModel,
  deleteModel,
} from "../controllers/model.js";

import { upload } from "../middleware/upload.js";
import { verifyToken } from "../middleware/middleware.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";
const router = Router();

router.post(
  "/",
     verifyToken,
  upload.single("image"),
  createModel
);

router.get("/",verifyAnyToken, getModels);

router.get("/:id",  verifyAnyToken,getModelById);

router.put(
  "/:id",
     verifyToken,
  upload.single("image"),
  updateModel
);

router.delete("/:id",   verifyToken, deleteModel);

export default router;