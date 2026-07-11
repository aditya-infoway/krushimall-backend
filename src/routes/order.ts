import {
  Router,
} from "express";

import {
  createOrder,
  deleteOrder,
  getOrderById,
  getOrderByLeadId,
  getOrders,
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

// Get by lead ID
// Keep this ABOVE "/:id"
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

// Delete
router.delete(
  "/:id",
  verifyToken,
  deleteOrder,
);

export default router;