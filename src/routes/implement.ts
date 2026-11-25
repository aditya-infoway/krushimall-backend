import { Router } from "express";
import {
  createImplement,
  getImplements,
  getImplementById,
  updateImplement,
  deleteImplement,
} from "../controllers/implement.js";
import { verifyToken } from "../middleware/middleware.js";

const router = Router();

router.post("/", verifyToken, createImplement);
router.get("/", verifyToken, getImplements);
router.get("/:id", verifyToken, getImplementById);
router.put("/:id", verifyToken, updateImplement);
router.delete("/:id", verifyToken, deleteImplement);

export default router;
                                                     