import express from "express";
import {
  createAccessory,
  getAccessories,
  getAccessoriesHistory,
  updateAccessory,
  deleteAccessory,
} from "../../../controllers/employee/storemanger/accessories.js";



import { verifyToken } from "../../../middleware/middleware.js";

const router = express.Router();

router.post("/", verifyToken, createAccessory);

router.get("/", verifyToken, getAccessories);

router.get("/history/:id", verifyToken, getAccessoriesHistory);

router.put("/:id", verifyToken, updateAccessory);

router.delete("/:id", verifyToken, deleteAccessory);

export default router;