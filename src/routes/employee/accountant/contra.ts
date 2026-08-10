import { Router } from "express";
import * as ContraController from "../../../controllers/employee/accountant/contra.js";

import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";
const router = Router();

router.get("/", verifyEmployeeToken, ContraController.getContras);

router.get(
  "/generate-voucher",
  
  ContraController.getNextContraVoucher
);

router.get(
  "/export/excel",
  
  ContraController.exportContraExcel
);

router.get("/:id",  ContraController.getContraById);

router.post("/", verifyEmployeeToken, ContraController.createContra);

export default router;