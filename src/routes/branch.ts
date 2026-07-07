import express from "express";
import { verifyToken } from "../middleware/middleware.js";

import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  toggleBranchStatus
} from "../controllers/branch.js";

const router = express.Router();

router.post("/", verifyToken, createBranch);

router.get("/", verifyToken, getBranches);

router.get("/:id", verifyToken, getBranchById);

router.put("/:id", verifyToken, updateBranch);

router.delete("/:id", verifyToken, deleteBranch);
router.patch("/:id/status", verifyToken, toggleBranchStatus);
export default router;