// routes/employee/storemanager/accessoriesAllot.ts

import { Router } from "express";
import { verifyToken } from "../../../middleware/middleware.js";

import {
  getAccessoriesAllotList,
  getAccessoriesAllotDetails,
  allotAccessoryStock,
  saveAccessoriesAllotment,
} from "../../../controllers/order.js";

const router = Router();

router.get("/", verifyToken, getAccessoriesAllotList);

router.get("/:id", verifyToken, getAccessoriesAllotDetails);

router.patch(
  "/:allotmentId/item/:itemId/allot",
  verifyToken,
  allotAccessoryStock
);

router.post(
  "/:id/save",
  verifyToken,
  saveAccessoriesAllotment
);

export default router;