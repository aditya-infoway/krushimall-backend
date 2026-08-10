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



const router = Router();

router.post("/", verifyToken, createLead);

router.get("/",  getLeads);

router.get("/pending",  getLeadsForCashReceipt);

router.get("/quotation-history",  getQuotationHistoryList);

router.get(
  "/quotation-history/:id",

  getQuotationHistoryByLeadId
);

router.get(
  "/booking-balance",

  getBookingBalance
);

router.get("/:id/quotation", generateOrderBillPdf);

router.put("/:id/quotation", verifyToken, updateQuotation);

router.get("/:id",  getLeadById);;

export default router;
