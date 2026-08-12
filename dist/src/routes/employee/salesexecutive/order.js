import express from "express";
import { verifyEmployeeToken } from "../../../middleware/employeeMiddleware.js";
import * as OrderController from "../../../controllers/employee/salesexecutive/order.js";
const router = express.Router();
router.post("/", verifyEmployeeToken, OrderController.createOrder);
router.get("/", verifyEmployeeToken, OrderController.getOrders);
// ✅ Specific routes first
router.get("/lead/:leadId/delivery-challan", OrderController.printDeliveryChallan);
router.get("/lead/:leadId", verifyEmployeeToken, OrderController.getOrderByLeadId);
// ✅ Generic route last
router.get("/:id", verifyEmployeeToken, OrderController.getOrderById);
router.delete("/:id", verifyEmployeeToken, OrderController.deleteOrder);
export default router;
//# sourceMappingURL=order.js.map