import express from "express";

import {
  createEnquiryStatus,
  getEnquiryStatuses,
  getEnquiryStatusById,
  updateEnquiryStatus,
  deleteEnquiryStatus,
  toggleEnquiryStatus,
} from "../controllers/enquiryStatus.js";
import { verifyToken } from "../middleware/middleware.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";

const router = express.Router();

router.post("/", verifyToken, createEnquiryStatus);
router.get("/", verifyAnyToken, getEnquiryStatuses);
router.get("/:id", verifyAnyToken, getEnquiryStatusById);
router.put("/:id", verifyToken, updateEnquiryStatus);
router.delete("/:id", verifyToken, deleteEnquiryStatus);

router.patch("/toggle-status/:id", verifyToken, toggleEnquiryStatus);

export default router;