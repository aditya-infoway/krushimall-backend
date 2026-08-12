// routes/branch/ledger.ts

import { Router } from "express";
import * as LedgerController from "../../controllers/ledger.js";
import { verifyBranchToken } from "../../middleware/branchMiddleware.js";
const router = Router();

// Ledger report
router.get(
  "/report",
  verifyBranchToken,
  LedgerController.getLedgerReport
);

// Ledger report Excel export
router.get(
  "/export",
  verifyBranchToken,
  LedgerController.exportLedgerReport
);

// Ledger details
router.get(
  "/details/:id",
  verifyBranchToken,
  LedgerController.getLedgerDetails
);

// Ledger details Excel export
router.get(
  "/details/:id/export",
  verifyBranchToken,
  LedgerController.exportLedgerDetails
);

export default router;