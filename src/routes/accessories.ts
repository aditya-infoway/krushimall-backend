import express from "express";
import {
  createAccessory,
  getAccessories,
  updateAccessory,
  deleteAccessory,
  getAccessoriesHistory,
} from "../controllers/accessories.js";
import { verifyToken } from "../middleware/middleware.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";

const router = express.Router();

router.post("/", verifyToken, createAccessory);
router.get("/", verifyAnyToken, getAccessories);
router.get("/history/:id", verifyAnyToken, getAccessoriesHistory);
router.put("/:id", verifyToken, updateAccessory);
router.delete("/:id", verifyToken, deleteAccessory);

export default router;