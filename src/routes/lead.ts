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
  getBookingBalance
} from "../controllers/lead.js";



const router = Router();

router.post("/", verifyToken, createLead);

router.get("/", verifyToken, getLeads);

router.get("/quotation-history", verifyToken, getQuotationHistoryList);
router.get(
  "/quotation-history/:id",
  verifyToken,
  getQuotationHistoryByLeadId,
);
router.get(
  "/booking-balance",
  verifyToken,
  getBookingBalance,
);
router.get("/:id/quotation", generateOrderBillPdf);

router.put("/:id/quotation", verifyToken, updateQuotation);

router.get("/:id", verifyToken, getLeadById);

export default router;
