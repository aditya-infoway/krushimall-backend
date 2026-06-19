import express from "express";

import {
  createEnquiryStatus,
  getEnquiryStatuses,
  getEnquiryStatusById,
  updateEnquiryStatus,
  deleteEnquiryStatus,
  toggleEnquiryStatus,
} from "../controllers/enquiryStatus.js";

const router = express.Router();

router.post("/", createEnquiryStatus);
router.get("/", getEnquiryStatuses);
router.get("/:id", getEnquiryStatusById);
router.put("/:id", updateEnquiryStatus);
router.delete("/:id", deleteEnquiryStatus);

router.patch(
  "/toggle-status/:id",
  toggleEnquiryStatus
);

export default router;