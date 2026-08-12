import { Router } from "express";
import { verifyBranchToken } from "../../middleware/branchMiddleware.js";

import accountRoutes from "./account.js";
import bankPaymentRoutes from "./bankPayment.js";
import bankReceiptRoutes from "./bankReceipt.js";
import cashPaymentRoutes from "./cashPayment.js";
import cashReceiptRoutes from "./cashReceipt.js";
import contraRoutes from "./contra.js";
import followupRoutes from "./followup.js";
import leadRoutes from "./lead.js";
import orderRoutes from "./order.js";
import testDriveRoutes from "./testDrive.js";
import employeeRoutes from "./employee.js";
import purchaseRoutes from "./purchase.js";
import bankerRoutes from "./banker.js";
import ledgerRoutes from "./ledger.js";
const router = Router();

// 🔐 Protect ALL branch APIs


router.use("/accounts", accountRoutes);
router.use("/bank-payments", bankPaymentRoutes);
router.use("/bank-receipts", bankReceiptRoutes);
router.use("/cash-payments", cashPaymentRoutes);
router.use("/cash-receipts", cashReceiptRoutes);
router.use("/contra", contraRoutes);
router.use("/followups", followupRoutes);
router.use("/leads", leadRoutes);
router.use("/orders", orderRoutes);
router.use("/test-drives", testDriveRoutes);
router.use("/employees", employeeRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/bankers", bankerRoutes);
router.use("/ledger", ledgerRoutes);
export default router;