import express from "express";

import {
  createEnquiryType,
  getEnquiryTypes,
  getEnquiryTypeById,
  updateEnquiryType,
  deleteEnquiryType,
  toggleEnquiryTypeStatus,
} from "../controllers/enquiryType.js";
import { verifyToken } from "../middleware/middleware.js";
const router = express.Router();

router.post("/", verifyToken, createEnquiryType);
router.get("/",   getEnquiryTypes);
router.get("/:id",   getEnquiryTypeById);
router.put("/:id", verifyToken, updateEnquiryType);
router.delete("/:id", verifyToken, deleteEnquiryType);

router.patch(
  "/toggle-status/:id",
   verifyToken,
  toggleEnquiryTypeStatus
);

export default router;