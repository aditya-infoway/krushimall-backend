import { Router } from "express";
import * as TestDriveController from "../../controllers/branch/testDrive.js";
import { verifyBranchToken } from "../../middleware/branchMiddleware.js";

const router = Router();

router.post("/", verifyBranchToken, TestDriveController.createTestDrive);

// History routes (must be before /:id)
router.get("/history", verifyBranchToken, TestDriveController.getTestDriveHistory);
router.get("/history/:id", verifyBranchToken, TestDriveController.getTestDriveHistoryByLead);

router.get("/", verifyBranchToken, TestDriveController.getTestDrives);
router.get("/:id", verifyBranchToken, TestDriveController.getTestDriveById);

router.put("/:id", verifyBranchToken, TestDriveController.updateTestDrive);
router.delete("/:id", verifyBranchToken, TestDriveController.deleteTestDrive);

export default router;