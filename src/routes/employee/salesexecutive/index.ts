import { Router } from "express";
import leadRoutes from "./lead.js";
import followupRoutes from "./followup.js";
import orderRoutes from "./order.js";
import accountRoutes from "./account.js";
const router = Router();

router.use("/lead", leadRoutes);
router.use("/followup", followupRoutes);
router.use("/order", orderRoutes);
router.use("/account", accountRoutes);
export default router;