import { Router } from "express";
import * as TestDriveController from "../../../controllers/employee/salesexecutive/testDrive.js";
import { verifyToken } from "../../../middleware/middleware.js";

const router = Router();

router.post("/", verifyToken, TestDriveController.createTestDrive);

// History routes (must be before /:id)
router.get("/history", verifyToken, TestDriveController.getTestDriveHistory);
router.get("/history/:id", verifyToken, TestDriveController.getTestDriveHistoryByLead);

router.get("/", verifyToken, TestDriveController.getTestDrives);
router.get("/:id", verifyToken, TestDriveController.getTestDriveById);

router.put("/:id", verifyToken, TestDriveController.updateTestDrive);
router.delete("/:id", verifyToken, TestDriveController.deleteTestDrive);

export default router;