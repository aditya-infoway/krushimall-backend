import express from "express";
import { createEnquiryStatus, getEnquiryStatuses, getEnquiryStatusById, updateEnquiryStatus, deleteEnquiryStatus, toggleEnquiryStatus, } from "../controllers/enquiryStatus.js";
import { verifyToken } from "../middleware/middleware.js";
const router = express.Router();
router.post("/", verifyToken, createEnquiryStatus);
router.get("/", getEnquiryStatuses);
router.get("/:id", getEnquiryStatusById);
router.put("/:id", verifyToken, updateEnquiryStatus);
router.delete("/:id", verifyToken, deleteEnquiryStatus);
router.patch("/toggle-status/:id", verifyToken, toggleEnquiryStatus);
export default router;
//# sourceMappingURL=enquiryStatus.js.map