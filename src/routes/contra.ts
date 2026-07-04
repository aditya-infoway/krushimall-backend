import express from "express";
import {
  createContra,
  getContras,
  getContraById,
  getNextContraVoucher,
} from "../controllers/contra.js";
import { verifyToken } from "../middleware/middleware.js";

const router = express.Router();

router.get("/", verifyToken, getContras);

router.get("/voucher", verifyToken, getNextContraVoucher);

router.get("/:id", verifyToken, getContraById);

router.post("/", verifyToken, createContra);

export default router;