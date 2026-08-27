import express from "express";
import { verifyWebToken } from "../../middleware/verifyWebToken.js";
import { upload } from "../../middleware/upload.js"; // ⚠️ apna actual path yahan daalna — jahan bhi yeh `upload` export hota hai
import {
  placeOrder,
  getMyOrders,
  getOrderByNumber,
  cancelOrderItem,
} from "../../controllers/web/order.js";
 
const router = express.Router();
 
router.use(verifyWebToken);
 
router.post("/place", placeOrder);
router.get("/my-orders", getMyOrders);
router.patch("/cancel", upload.array("images", 5), cancelOrderItem);
router.get("/:orderNumber", getOrderByNumber);
// ⚠️ NOTE: "/:orderNumber" dynamic route ko "/cancel" ke NEECHE hi rakhna,
// warna "/cancel" bhi :orderNumber ban ke getOrderByNumber mein chala jayega.
 
export default router;