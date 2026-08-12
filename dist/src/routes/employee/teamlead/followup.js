import { Router } from "express";
import * as FollowUpController from "../../../controllers/employee/teamlead/followup.js";
import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";
const router = Router();
router.post("/", verifyEmployeeToken, FollowUpController.createFollowUp);
router.get("/:leadId", verifyEmployeeToken, FollowUpController.getFollowUpsByLead);
router.get("/:leadId/latest", verifyEmployeeToken, FollowUpController.getLatestFollowUpByLead);
router.get("/board", verifyEmployeeToken, FollowUpController.getFollowUpBoard);
export default router;
//# sourceMappingURL=followup.js.map