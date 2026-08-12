import express from "express";
import { createContra, getContras, getContraById, getNextContraVoucher, exportContraExcel } from "../controllers/contra.js";
import { verifyToken } from "../middleware/middleware.js";
const router = express.Router();
router.get("/", verifyToken, getContras);
router.get("/voucher", getNextContraVoucher);
router.get("/:id", verifyToken, getContraById);
router.post("/", verifyToken, createContra);
router.get("/export/excel", exportContraExcel);
export default router;
//# sourceMappingURL=contra.js.map