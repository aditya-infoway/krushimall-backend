import { Router } from "express";
import * as LeadController from "../../../controllers/employee/salesexecutive/lead.js";
import {verifyToken} from "../../../middleware/middleware.js";

const router = Router();

router.post("/", verifyToken, LeadController.createLead);
router.get("/", verifyToken, LeadController.getLeads);
router.get(
  "/pending",
  verifyToken,
  LeadController.getLeadsForCashReceipt,
);
router.get("/:id", verifyToken, LeadController.getLeadById);

router.put(
  "/quotation/:id",
  verifyToken,
  LeadController.updateQuotation,
);

router.get(
  "/quotation/history",
  verifyToken,
  LeadController.getQuotationHistoryList,
);

router.get(
  "/quotation/history/:id",
  verifyToken,
  LeadController.getQuotationHistoryByLeadId,
);

router.get(
  "/quotation/pdf/:id",
  verifyToken,
  LeadController.generateOrderBillPdf,
);

router.get(
  "/booking-balance",
  verifyToken,
  LeadController.getBookingBalance,
);

export default router;