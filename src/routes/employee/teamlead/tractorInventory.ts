// routes/branch/tractorInventory.ts

import { Router } from "express";
import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";
import {
  getTractorInventory,
} from "../../../controllers/employee/salesexecutive/tractorInventory.js";

const router = Router();

router.get(
  "/",
  verifyEmployeeToken,
  getTractorInventory
);

export default router;