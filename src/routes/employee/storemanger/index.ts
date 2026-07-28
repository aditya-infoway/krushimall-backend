import { Router } from "express";
import accessoryRoutes from "./accessories.js"
import accessoriesPurchaseRoutes from "./accessoriesPurchase.js";
import accessoriesAllotRouter from "./accessoriesAllot.js"
const router = Router();

router.use("/accessories", accessoryRoutes);


router.use(
  "/accessories-purchase",
  accessoriesPurchaseRoutes
);
router.use("/accessories-allot", accessoriesAllotRouter);
export default router;