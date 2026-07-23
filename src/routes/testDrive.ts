import { Router } from "express";
import * as TestDriveController from "../controllers/testDrive.js";
import { verifyToken } from "../middleware/middleware.js";

const router = Router();

router.post("/", verifyToken, TestDriveController.createTestDrive);

router.get("/", verifyToken, TestDriveController.getTestDrives);

// ✅ Test Drive History
router.get(
  "/history",
  verifyToken,
  TestDriveController.getTestDriveHistory
);

router.get(
  "/history/:id",
  verifyToken,
  TestDriveController.getTestDriveHistoryByLead
);

// Existing routes
router.get("/:id", verifyToken, TestDriveController.getTestDriveById);

router.put("/:id", verifyToken, TestDriveController.updateTestDrive);

router.delete("/:id", verifyToken, TestDriveController.deleteTestDrive);

export default router;