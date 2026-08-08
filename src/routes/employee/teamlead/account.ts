import express from "express";
import { verifyToken } from "../../../middleware/middleware.js";

import * as AccountController from "../../../controllers/employee/teamlead/account.js";

const router = express.Router();

// ==========================================
// ACCOUNT ROUTES
// ==========================================

router.post("/", verifyToken, AccountController.createAccount);

router.get("/", verifyToken, AccountController.getAccounts);

router.get("/:id", verifyToken, AccountController.getAccountById);

router.put("/:id", verifyToken, AccountController.updateAccount);

router.delete("/:id", verifyToken, AccountController.deleteAccount);

export default router;