import { Router } from "express";
import { verifyToken } from "../middleware/middleware.js";
import {
  createLead,
  getLeads,
  generateOrderBillPdf,
  getLeadById,
  updateQuotation
} from "../controllers/lead.js";

const router = Router();

router.post("/", verifyToken, createLead);

router.get("/", verifyToken, getLeads);

router.get("/:id/Quotation", generateOrderBillPdf);
router.put(
  "/:id/quotation",
  verifyToken,
  updateQuotation,
);
router.get("/:id", verifyToken, getLeadById);

export default router;