import express from "express";
import { verifyToken } from "../../../middleware/middleware.js";
import * as OrderController from "../../../controllers/employee/salesexecutive/order.js";

const router = express.Router();

router.post("/", verifyToken, OrderController.createOrder);

router.get("/", verifyToken, OrderController.getOrders);

// ✅ Specific routes first
router.get(
  "/lead/:leadId/delivery-challan",
 
  OrderController.printDeliveryChallan
);

router.get(
  "/lead/:leadId",
  verifyToken,
  OrderController.getOrderByLeadId
);

// ✅ Generic route last
router.get("/:id", verifyToken, OrderController.getOrderById);

router.delete("/:id", verifyToken, OrderController.deleteOrder);

export default router;