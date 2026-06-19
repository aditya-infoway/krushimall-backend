import express from "express";

import {
  createEnquiryType,
  getEnquiryTypes,
  getEnquiryTypeById,
  updateEnquiryType,
  deleteEnquiryType,
  toggleEnquiryTypeStatus,
} from "../controllers/enquiryType.js";

const router = express.Router();

router.post("/", createEnquiryType);
router.get("/", getEnquiryTypes);
router.get("/:id", getEnquiryTypeById);
router.put("/:id", updateEnquiryType);
router.delete("/:id", deleteEnquiryType);

router.patch(
  "/toggle-status/:id",
  toggleEnquiryTypeStatus
);

export default router;