import express from "express";

import {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
} from "../controllers/account.js";

import { verifyToken } from "../middleware/middleware.js";

const router = express.Router();

router.post("/", verifyToken, createAccount);

router.get("/", verifyToken, getAccounts);

router.get("/:id", verifyToken, getAccountById);

router.put("/:id", verifyToken, updateAccount);

router.delete("/:id", verifyToken, deleteAccount);

export default router;