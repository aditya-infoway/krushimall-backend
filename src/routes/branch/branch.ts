import express from "express";
import { verifyBranchToken } from "../../middleware/branchMiddleware.js";
import { multerErrorHandler } from "../../middleware/multerErrorHandler.js";


import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  toggleBranchStatus,
  loginBranch,
} from "../../controllers/branch.js";

import { upload } from "../../middleware/upload.js";

const router = express.Router();

// router.post("/", verifyToken, upload.single("logo"), createBranch);

router.post(
  "/",
  verifyBranchToken,
  upload.single("logo"),
  multerErrorHandler,
  createBranch,
);


router.get("/",verifyBranchToken,  getBranches);

router.get("/:id",verifyBranchToken,  getBranchById);

// router.put("/:id", verifyToken, upload.single("logo"), updateBranch);

router.put(
  "/:id",
  verifyBranchToken,
  upload.single("logo"),
  multerErrorHandler,
  updateBranch,
);

router.delete("/:id", verifyBranchToken, deleteBranch);
router.patch("/:id/status", verifyBranchToken, toggleBranchStatus);

router.post("/login", loginBranch);
export default router;




