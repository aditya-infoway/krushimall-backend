import { Router } from "express";
import {
  getBankers,
} from "../../controllers/banker.js";
import { verifyBranchToken } from "../../middleware/branchMiddleware.js";
const router = Router();

router.get(
  "/",
  verifyBranchToken,
  getBankers
);

export default router;