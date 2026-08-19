import { Router } from "express";
import * as LeadController from "../../controllers/branch/lead.js";
import { verifyBranchToken } from "../../middleware/branchMiddleware.js";
const router = Router();

// ==========================================
// BASIC LEAD ROUTES
// ==========================================

router.post(
  "/",
   verifyBranchToken,
  LeadController.createLead
);

router.get(
  "/",
  verifyBranchToken,
  LeadController.getLeads
);

router.get(
  "/pending",
   verifyBranchToken,
  LeadController.getLeadsForCashReceipt
);


// ==========================================
// QUOTATION ROUTES
// IMPORTANT: BEFORE /:id
// ==========================================

router.put(
  "/:id/quotation",
   verifyBranchToken,
  LeadController.updateQuotation
);

router.get(
  "/quotation-history",
   verifyBranchToken,
  LeadController.getQuotationHistoryList
);

router.get(
  "/quotation-history/:id",
   verifyBranchToken,
  LeadController.getQuotationHistoryByLeadId
);

router.get(
  "/quotation/pdf/:id",
   verifyBranchToken,
  LeadController.generateOrderBillPdf
);

router.get(
  "/booking-balance",
   verifyBranchToken,
  LeadController.getBookingBalance
);
router.get(
  "/:id/payments",
   verifyBranchToken,
  LeadController.getLeadPayments
);

// ==========================================
// GET LEAD BY ID
// MUST BE LAST
// ==========================================

router.get(
  "/:id",
   verifyBranchToken,
  LeadController.getLeadById
);

export default router;