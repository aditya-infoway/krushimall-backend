import { Router } from "express";
import {
  createLead,
  getLeads,
  generateOrderBillPdf,
  getLeadById
} from "../controllers/lead.js";

const router = Router();

router.post("/", createLead);
router.get("/", getLeads);
router.get(
  "/:id/Quotation",
  generateOrderBillPdf
);
router.get("/:id", getLeadById);
export default router;