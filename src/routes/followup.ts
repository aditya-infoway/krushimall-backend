import express from "express";

import {
  createFollowUp,
  getFollowUpsByLead,
  getFollowUpBoard,
  getLatestFollowUpByLead
} from "../controllers/followup.js";
import { verifyToken } from "../middleware/middleware.js";

const router = express.Router();

router.post("/", verifyToken, createFollowUp);

router.get("/lead/:leadId",  getFollowUpsByLead);
router.get(
  "/lead/:leadId/latest",
  getLatestFollowUpByLead,
);
router.get("/board",  getFollowUpBoard);

export default router;
