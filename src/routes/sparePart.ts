import express from "express";
import {
  createSparePart,
  getSpareParts,
  getSparePartHistory,
  updateSparePart,
  deleteSparePart,
} from "../controllers/sparePart.js";
import { verifyToken } from "../middleware/middleware.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";

const router = express.Router();

router.post("/", verifyToken, createSparePart);
router.get("/", verifyToken, getSpareParts);
router.get("/:id/history", verifyAnyToken, getSparePartHistory);
router.put("/:id", verifyToken, updateSparePart);
router.delete("/:id", verifyToken, deleteSparePart);

export default router;
