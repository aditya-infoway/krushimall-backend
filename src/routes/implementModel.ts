import { Router } from "express";
import {
  createImplementModel,
  getImplementModels,
  getImplementModelById,
  updateImplementModel,
  deleteImplementModel,
} from "../controllers/implementModel.js";
import { verifyToken } from "../middleware/middleware.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.post("/", verifyToken, upload.single("image"), createImplementModel);
router.get("/", verifyAnyToken, getImplementModels);
router.get("/:id", verifyAnyToken, getImplementModelById);
router.put("/:id", verifyToken, upload.single("image"), updateImplementModel);
router.delete("/:id", verifyToken, deleteImplementModel);

export default router;
