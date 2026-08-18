import express from "express";
import { verifyBranchToken } from "../../middleware/branchMiddleware.js";
import { multerErrorHandler } from "../../middleware/multerErrorHandler.js";


import {

  getBranches,
  getBranchById,
  updateBranch,
 


} from "../../controllers/branch.js";

import { upload } from "../../middleware/upload.js";

const router = express.Router();

router.get("/",verifyBranchToken,  getBranches);

router.get("/:id",verifyBranchToken,  getBranchById);

router.put(
  "/:id",
  verifyBranchToken,
  upload.single("logo"),
  multerErrorHandler,
  updateBranch,
);



export default router;




