import { Router } from "express";
import { verifyToken } from "../middleware/middleware.js";

import {
  createLead,
  getLeads,
  generateOrderBillPdf,
  getLeadById,
  updateQuotation,
  getQuotationHistoryList,
  getQuotationHistoryByLeadId,
  getBookingBalance,
  getLeadsForCashReceipt
} from "../controllers/lead.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";


const router = Router();

router.post("/", verifyToken, createLead);

router.get("/",verifyAnyToken,  getLeads);

router.get("/pending", verifyAnyToken, getLeadsForCashReceipt);

router.get("/quotation-history",verifyAnyToken,  getQuotationHistoryList);

router.get(
  "/quotation-history/:id",
verifyAnyToken,
  getQuotationHistoryByLeadId
);

router.get(
  "/booking-balance",
verifyAnyToken,
  getBookingBalance
);

router.get("/:id/quotation", generateOrderBillPdf);

router.put("/:id/quotation", verifyToken, updateQuotation);

router.get("/:id", verifyAnyToken, getLeadById);;

export default router;
