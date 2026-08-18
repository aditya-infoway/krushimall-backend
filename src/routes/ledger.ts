import express from "express";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";
import {
  getLedgerReport,
  getLedgerDetails,
  exportLedgerReport,
  exportLedgerDetails
} from "../controllers/ledger.js";

const router = express.Router();

// Ledger Report
router.get(
  "/report",
  verifyAnyToken,
  getLedgerReport
);

// Ledger Details
router.get(
  "/details/:id",
  verifyAnyToken,
  getLedgerDetails
);

// Export routes
router.get("/export", verifyAnyToken, exportLedgerReport);
router.get("/details/:id/export", verifyAnyToken, exportLedgerDetails);

export default router;