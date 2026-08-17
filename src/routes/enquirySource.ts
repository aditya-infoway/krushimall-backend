import express from "express";

import {
  createEnquirySource,
  getEnquirySources,
  getEnquirySourceById,
  updateEnquirySource,
  deleteEnquirySource,
  toggleEnquirySourceStatus,
} from "../controllers/enquirySource.js";
import { verifyToken } from "../middleware/middleware.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";

const router = express.Router();

router.post("/", verifyToken, createEnquirySource);
router.get("/", verifyAnyToken, getEnquirySources);
router.get("/:id", verifyAnyToken, getEnquirySourceById);
router.put("/:id", verifyToken, updateEnquirySource);
router.delete("/:id", verifyToken, deleteEnquirySource);

router.patch("/toggle-status/:id", verifyToken, toggleEnquirySourceStatus);

export default router;