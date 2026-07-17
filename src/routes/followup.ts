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

router.get("/lead/:leadId", verifyToken, getFollowUpsByLead);
router.get(
  "/lead/:leadId/latest",
  verifyToken,
  getLatestFollowUpByLead,
);
router.get("/board", verifyToken, getFollowUpBoard);

export default router;
