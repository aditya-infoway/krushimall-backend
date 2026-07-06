import express from "express";
import { verifyToken } from "../middleware/middleware.js";
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
  verifyToken,
  getLedgerReport
);

// Ledger Details
router.get(
  "/details/:id",
  verifyToken,
  getLedgerDetails
);
// routes
router.get("/export", verifyToken, exportLedgerReport);
router.get("/details/:id/export", exportLedgerDetails);
export default router;