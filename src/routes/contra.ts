import express from "express";
import {
  createContra,
  getContras,
  getContraById,
  getNextContraVoucher,
  exportContraExcel
} from "../controllers/contra.js";
import { verifyToken } from "../middleware/middleware.js";

const router = express.Router();

router.get("/", verifyToken, getContras);

router.get("/voucher", verifyToken, getNextContraVoucher);

router.get("/:id", verifyToken, getContraById);

router.post("/", verifyToken, createContra);
router.get(
  "/export/excel",
  verifyToken,
  exportContraExcel
);
export default router;