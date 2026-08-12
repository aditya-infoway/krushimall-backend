import { Router } from "express";
import leadRoutes from "./lead.js";
import followupRoutes from "./followup.js";
import orderRoutes from "./order.js";
import accountRoutes from "./account.js";
import testDriveRoutes from "./testDrive.js";
const router = Router();
router.use("/lead", leadRoutes);
router.use("/followup", followupRoutes);
router.use("/order", orderRoutes);
router.use("/account", accountRoutes);
router.use("/test-drives", testDriveRoutes);
export default router;
//# sourceMappingURL=index.js.map