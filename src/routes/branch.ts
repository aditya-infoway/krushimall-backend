import express from "express";
import { verifyToken } from "../middleware/middleware.js";
import { multerErrorHandler } from "../middleware/multerErrorHandler.js";


import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  toggleBranchStatus,
  loginBranch,
} from "../controllers/branch.js";

import { upload } from "../middleware/upload.js";

const router = express.Router();

// router.post("/", verifyToken, upload.single("logo"), createBranch);

router.post(
  "/",
  verifyToken,
  upload.single("logo"),
  multerErrorHandler,
  createBranch,
);


router.get("/", verifyToken, getBranches);

router.get("/:id", verifyToken, getBranchById);

// router.put("/:id", verifyToken, upload.single("logo"), updateBranch);

router.put(
  "/:id",
  verifyToken,
  upload.single("logo"),
  multerErrorHandler,
  updateBranch,
);

router.delete("/:id", verifyToken, deleteBranch);
router.patch("/:id/status", verifyToken, toggleBranchStatus);

router.post("/login", loginBranch);
export default router;




