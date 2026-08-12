import { Router } from "express";
import * as FollowUpController from "../../../controllers/employee/salesexecutive/followup.js";
import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";
const router = Router();
router.post("/", verifyEmployeeToken, FollowUpController.createFollowUp);
router.get("/:leadId", FollowUpController.getFollowUpsByLead);
router.get("/:leadId/latest", FollowUpController.getLatestFollowUpByLead);
router.get("/board", FollowUpController.getFollowUpBoard);
export default router;
//# sourceMappingURL=followup.js.map