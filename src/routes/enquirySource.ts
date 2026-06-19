import express from "express";

import {
  createEnquirySource,
  getEnquirySources,
  getEnquirySourceById,
  updateEnquirySource,
  deleteEnquirySource,
  toggleEnquirySourceStatus,
} from "../controllers/enquirySource.js";

const router = express.Router();

router.post("/", createEnquirySource);
router.get("/", getEnquirySources);
router.get("/:id", getEnquirySourceById);
router.put("/:id", updateEnquirySource);
router.delete("/:id", deleteEnquirySource);

router.patch(
  "/toggle-status/:id",
  toggleEnquirySourceStatus
);

export default router;