// routes/employee/storemanager/accessoriesAllot.ts

import { Router } from "express";
import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";

import {
  getAccessoriesAllotList,
  getAccessoriesAllotDetails,
  allotAccessoryStock,
  saveAccessoriesAllotment,
} from "../../../controllers/order.js";

const router = Router();

router.get("/", verifyEmployeeToken, getAccessoriesAllotList);

router.get("/:id", verifyEmployeeToken, getAccessoriesAllotDetails);

router.patch(
  "/:allotmentId/item/:itemId/allot",
  verifyEmployeeToken,
  allotAccessoryStock
);

router.post(
  "/:id/save",
  verifyEmployeeToken,
  saveAccessoriesAllotment
);

export default router;