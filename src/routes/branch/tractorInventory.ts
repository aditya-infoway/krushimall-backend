// routes/branch/tractorInventory.ts

import { Router } from "express";
import { verifyBranchToken } from "../../middleware/branchMiddleware.js";
import {
  getBranchTractorInventory,
} from "../../controllers/branch/tractorInventory.js";

const router = Router();

router.get(
  "/",
  verifyBranchToken,
  getBranchTractorInventory
);

export default router;