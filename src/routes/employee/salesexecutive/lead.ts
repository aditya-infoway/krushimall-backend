import { Router } from "express";
import * as LeadController from "../../../controllers/employee/salesexecutive/lead.js";
import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";

const router = Router();

router.post("/", verifyEmployeeToken, LeadController.createLead);
router.get("/",verifyEmployeeToken, LeadController.getLeads);
router.get(
  "/pending",
  verifyEmployeeToken,
  LeadController.getLeadsForCashReceipt,
);
router.get("/:id",verifyEmployeeToken,  LeadController.getLeadById);

router.put(
  "/quotation/:id",
  verifyEmployeeToken,
  LeadController.updateQuotation,
);

router.get(
  "/quotation/history",
  verifyEmployeeToken,
  LeadController.getQuotationHistoryList,
);

router.get(
  "/quotation/history/:id",
 verifyEmployeeToken,
  LeadController.getQuotationHistoryByLeadId,
);

router.get(
  "/quotation/pdf/:id",
  
  LeadController.generateOrderBillPdf,
);

router.get(
  "/booking-balance",
verifyEmployeeToken,
  LeadController.getBookingBalance,
);

export default router;