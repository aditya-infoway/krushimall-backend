// account.ts

import express from "express";
import { verifyBranchToken } from "../../middleware/branchMiddleware.js";
import * as AccountController from "../../controllers/branch/account.js";

const router = express.Router();

router.post("/", verifyBranchToken, AccountController.createAccount);
router.get("/",verifyBranchToken,  AccountController.getAccounts);
router.get("/:id",verifyBranchToken,  AccountController.getAccountById);
router.put("/:id",verifyBranchToken,  AccountController.updateAccount);
router.delete("/:id",verifyBranchToken,  AccountController.deleteAccount);

export default router;