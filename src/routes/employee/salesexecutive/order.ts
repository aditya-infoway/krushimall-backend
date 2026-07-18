import express from "express";
import {verifyToken} from "../../../middleware/middleware.js";
import * as OrderController from "../../../controllers/employee/salesexecutive/order.js";

const router = express.Router();

router.post("/", verifyToken, OrderController.createOrder);
router.get("/", verifyToken, OrderController.getOrders);
router.get("/:id", verifyToken, OrderController.getOrderById);
router.get("/lead/:leadId", verifyToken, OrderController.getOrderByLeadId);
router.delete("/:id", verifyToken, OrderController.deleteOrder);

export default router;