import { Router } from "express";
import accessoryRoutes from "./accessories.js";
import accessoriesPurchaseRoutes from "./accessoriesPurchase.js";
import accessoriesAllotRouter from "./accessoriesAllot.js";
import accountRoutes from "./account.js";
const router = Router();
router.use("/accessories", accessoryRoutes);
router.use("/account", accountRoutes);
router.use("/accessories-purchase", accessoriesPurchaseRoutes);
router.use("/accessories-allot", accessoriesAllotRouter);
export default router;
//# sourceMappingURL=index.js.map