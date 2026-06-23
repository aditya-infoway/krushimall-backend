import express from "express";

import {
  createFollowUp,
  getFollowUpsByLead,
} from "../controllers/followup.js";

const router = express.Router();

router.post("/", createFollowUp);

router.get(
  "/lead/:leadId",
  getFollowUpsByLead
);

export default router;