import express from "express";
import {
  createAccessory,
  getAccessories,
  updateAccessory,
  deleteAccessory,
} from "../controllers/accessories.js";

const router = express.Router();

router.post("/", createAccessory);
router.get("/", getAccessories);
router.put("/:id", updateAccessory);
router.delete("/:id", deleteAccessory);

export default router;