import express from "express";
import {
  createAccessory,
  getAccessories,
  updateAccessory,
  deleteAccessory,
  getAccessoriesHistory
} from "../controllers/accessories.js";
import { verifyToken } from "../middleware/middleware.js";
const router = express.Router();

router.post("/",verifyToken, createAccessory);
router.get("/", getAccessories);
router.get(
  "/history/:id",
  
  getAccessoriesHistory
);
router.put("/:id",verifyToken, updateAccessory);
router.delete("/:id",verifyToken, deleteAccessory);

export default router;