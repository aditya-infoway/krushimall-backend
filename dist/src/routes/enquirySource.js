import express from "express";
import { createEnquirySource, getEnquirySources, getEnquirySourceById, updateEnquirySource, deleteEnquirySource, toggleEnquirySourceStatus, } from "../controllers/enquirySource.js";
import { verifyToken } from "../middleware/middleware.js";
const router = express.Router();
router.post("/", verifyToken, createEnquirySource);
router.get("/", getEnquirySources);
router.get("/:id", getEnquirySourceById);
router.put("/:id", verifyToken, updateEnquirySource);
router.delete("/:id", verifyToken, deleteEnquirySource);
router.patch("/toggle-status/:id", verifyToken, toggleEnquirySourceStatus);
export default router;
//# sourceMappingURL=enquirySource.js.map