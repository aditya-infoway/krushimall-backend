import { Router } from "express";
import {
  createImplementColour,
  getImplementColours,
  getImplementColourById,
  updateImplementColour,
  deleteImplementColour,
} from "../controllers/implementColour.js";
import { verifyToken } from "../middleware/middleware.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";

const router = Router();

router.post("/", verifyToken, createImplementColour);
router.get("/", verifyAnyToken, getImplementColours);
router.get("/:id", verifyAnyToken, getImplementColourById);
router.put("/:id", verifyToken, updateImplementColour);
router.delete("/:id", verifyToken, deleteImplementColour);

export default router;
