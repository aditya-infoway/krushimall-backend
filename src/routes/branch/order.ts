import express from "express";
import { verifyBranchToken } from "../../middleware/branchMiddleware.js";
import * as OrderController from "../../controllers/branch/order.js";

const router = express.Router();

router.post("/", verifyBranchToken, OrderController.createOrder);

router.get("/", verifyBranchToken, OrderController.getOrders);

// ✅ Specific routes first
router.get(
  "/lead/:leadId/delivery-challan",
 
  OrderController.printDeliveryChallan
);

router.get(
  "/lead/:leadId",
  verifyBranchToken,
  OrderController.getOrderByLeadId
);

// ✅ Generic route last
router.get("/:id", verifyBranchToken, OrderController.getOrderById);

router.delete("/:id", verifyBranchToken, OrderController.deleteOrder);

export default router;