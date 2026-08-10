import { Router } from "express";
import * as LeadController from "../../../controllers/employee/salesexecutive/lead.js";
import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";

const router = Router();

router.post("/", verifyEmployeeToken, LeadController.createLead);
router.get("/", LeadController.getLeads);
router.get(
  "/pending",
  
  LeadController.getLeadsForCashReceipt,
);
router.get("/:id",  LeadController.getLeadById);

router.put(
  "/quotation/:id",
  verifyEmployeeToken,
  LeadController.updateQuotation,
);

router.get(
  "/quotation/history",
  
  LeadController.getQuotationHistoryList,
);

router.get(
  "/quotation/history/:id",
 
  LeadController.getQuotationHistoryByLeadId,
);

router.get(
  "/quotation/pdf/:id",
  
  LeadController.generateOrderBillPdf,
);

router.get(
  "/booking-balance",

  LeadController.getBookingBalance,
);

export default router;