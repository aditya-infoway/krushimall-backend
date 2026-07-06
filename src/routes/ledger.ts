import express from "express";
import { verifyToken } from "../middleware/middleware.js";
import {
  getLedgerReport,
  getLedgerDetails,
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

export default router;