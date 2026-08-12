import { Router } from "express";
import * as TestDriveController from "../../../controllers/employee/teamlead/testDrive.js";
import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";
const router = Router();
router.post("/", verifyEmployeeToken, TestDriveController.createTestDrive);
// History routes (must be before /:id)
router.get("/history", verifyEmployeeToken, TestDriveController.getTestDriveHistory);
router.get("/history/:id", verifyEmployeeToken, TestDriveController.getTestDriveHistoryByLead);
router.get("/", verifyEmployeeToken, TestDriveController.getTestDrives);
router.get("/:id", verifyEmployeeToken, TestDriveController.getTestDriveById);
router.put("/:id", verifyEmployeeToken, TestDriveController.updateTestDrive);
router.delete("/:id", verifyEmployeeToken, TestDriveController.deleteTestDrive);
export default router;
//# sourceMappingURL=testDrive.js.map