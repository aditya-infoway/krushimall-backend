import { Router } from "express";
import {
  getTractorInventory,
  getPurchases
} from "../../controllers/purchase.js";
import { verifyBranchToken } from "../../middleware/branchMiddleware.js";
const router = Router();

// ==========================================
// TRACTOR INVENTORY
// ==========================================
router.get(
  "/",
   verifyBranchToken,
  getPurchases
);
router.get(
  "/tractor-inventory",
   verifyBranchToken,
  getTractorInventory
);

export default router;