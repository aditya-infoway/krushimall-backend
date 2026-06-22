import { Router } from "express";
import {
  createLead,
  getLeads,
  generateOrderBillPdf
} from "../controllers/lead.js";

const router = Router();

router.post("/", createLead);
router.get("/", getLeads);
router.get(
  "/:id/order-bill",
  generateOrderBillPdf
);
export default router;