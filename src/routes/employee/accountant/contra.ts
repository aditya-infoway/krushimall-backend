import { Router } from "express";
import * as ContraController from "../../../controllers/employee/accountant/contra.js";
import { verifyToken } from "../../../middleware/middleware.js";

const router = Router();

router.get("/", verifyToken, ContraController.getContras);

router.get(
  "/generate-voucher",
  verifyToken,
  ContraController.getNextContraVoucher
);

router.get(
  "/export/excel",
  verifyToken,
  ContraController.exportContraExcel
);

router.get("/:id", verifyToken, ContraController.getContraById);

router.post("/", verifyToken, ContraController.createContra);

export default router;