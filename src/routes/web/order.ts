// src/routes/order.routes.ts

import express from "express";
import { verifyWebToken } from "../../middleware/verifyWebToken.js";
import { placeOrder, getMyOrders, getOrderByNumber } from "../../controllers/web/order.js";

const router = express.Router();

router.use(verifyWebToken);

router.post("/place", placeOrder);
router.get("/my-orders", getMyOrders);
router.get("/:orderNumber", getOrderByNumber);

export default router;

// src/app.ts (ya server.ts) me mount karna:
//   import cartRoutes from "./routes/cart.routes.js";
//   import orderRoutes from "./routes/order.routes.js";
//   app.use("/api/cart", cartRoutes);
//   app.use("/api/orders", orderRoutes);