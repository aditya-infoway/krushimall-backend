import express from "express";

import {
  createFollowUp,
  getFollowUpsByLead,
  getFollowUpBoard,
  getLatestFollowUpByLead,
} from "../controllers/followup.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";

const router = express.Router();

// ✅ Sales Executive/Team Lead/Branch bhi apne leads ke liye
// follow-up create karte hain — sirf Admin tak restrict nahi karna
router.post("/", verifyAnyToken, createFollowUp);

// ✅ Pehle in teeno pe koi bhi middleware nahi tha — bina login
// koi bhi customer ka follow-up data (naam, notes, status) dekh sakta tha
router.get("/lead/:leadId", verifyAnyToken, getFollowUpsByLead);

router.get(
  "/lead/:leadId/latest",
  verifyAnyToken,
  getLatestFollowUpByLead,
);

router.get("/board", verifyAnyToken, getFollowUpBoard);

export default router;