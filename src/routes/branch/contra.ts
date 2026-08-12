import { Router } from "express";
import * as ContraController from "../../controllers/branch/contra.js";

import { verifyBranchToken } from "../../middleware/branchMiddleware.js";
const router = Router();

router.get("/", verifyBranchToken, ContraController.getContras);

router.get(
  "/generate-voucher",
  
  ContraController.getNextContraVoucher
);

router.get(
  "/export/excel",
  
  ContraController.exportContraExcel
);

router.get("/:id",  ContraController.getContraById);

router.post("/", verifyBranchToken, ContraController.createContra);

export default router;