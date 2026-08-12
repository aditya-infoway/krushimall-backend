import { Router } from "express";
import * as FollowUpController from "../../controllers/branch/followup.js";
import { verifyBranchToken } from "../../middleware/branchMiddleware.js";
const router = Router();

router.post(
  "/",
   verifyBranchToken,
  FollowUpController.createFollowUp
);

router.get(
  "/lead/:leadId",
   verifyBranchToken,
  FollowUpController.getFollowUpsByLead
);

router.get(
  "/lead/:leadId/latest",
   verifyBranchToken,
  FollowUpController.getLatestFollowUpByLead
);

router.get(
  "/board",
   verifyBranchToken,
  FollowUpController.getFollowUpBoard
);

export default router;