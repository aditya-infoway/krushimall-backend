import { Router } from "express";
import * as CashPaymentController from "../../controllers/branch/cashPayment.js";
import { verifyBranchToken } from "../../middleware/branchMiddleware.js";

const router = Router();

router.get("/", verifyBranchToken, CashPaymentController.getCashPayments);
router.get("/voucher", CashPaymentController.getCashPaymentVoucher);
router.get("/export/excel", verifyBranchToken, CashPaymentController.exportCashPaymentExcel);
router.get("/:id", verifyBranchToken, CashPaymentController.getCashPaymentById);

router.post("/", verifyBranchToken, CashPaymentController.createCashPayment);

router.put("/:id", verifyBranchToken, CashPaymentController.updateCashPayment);

router.delete("/:id", verifyBranchToken, CashPaymentController.deleteCashPayment);

export default router;