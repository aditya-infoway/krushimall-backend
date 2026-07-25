import {
  Router,
} from "express";

import {
  createOrder,
  deleteOrder,
  getOrderById,
  getOrderByLeadId,
  getOrders,
  printDeliveryChallan,
  getVehicleInchargeList,
  completeVehicleIncharge,
  getAccessoriesAllotList
} from "../controllers/order.js";

import {
  verifyToken,
} from "../middleware/middleware.js";

const router = Router();

// Create
router.post(
  "/",
  verifyToken,
  createOrder,
);

// Get all
router.get(
  "/",
  verifyToken,
  getOrders,
);
router.get(
  "/vehicle-incharge",
  verifyToken,
  getVehicleInchargeList
);
router.get(
  "/accessories-allot",
  verifyToken,
  getAccessoriesAllotList
);
// Get by lead ID
// Keep this ABOVE "/:id"
router.patch(
  "/vehicle-incharge/:id",
  verifyToken,
  completeVehicleIncharge
);
router.get(
  "/lead/:leadId",
  verifyToken,
  getOrderByLeadId,
);

// Get by order ID
router.get(
  "/:id",
  verifyToken,
  getOrderById,
);
router.get("/lead/:leadId/delivery-challan", printDeliveryChallan);
// Delete
router.delete(
  "/:id",
  verifyToken,
  deleteOrder,
);

export default router;