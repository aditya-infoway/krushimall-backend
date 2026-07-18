import { Router } from "express";
import * as FollowUpController from "../../../controllers/employee/salesexecutive/followup.js";
import { verifyToken } from "../../../middleware/middleware.js";

const router = Router();

router.post("/", verifyToken, FollowUpController.createFollowUp);

router.get(
  "/:leadId",
  verifyToken,
  FollowUpController.getFollowUpsByLead,
);
router.get(
  "/:leadId/latest",
  verifyToken,
  FollowUpController.getLatestFollowUpByLead,
);
router.get(
  "/board",
  verifyToken,
  FollowUpController.getFollowUpBoard,
);

export default router;