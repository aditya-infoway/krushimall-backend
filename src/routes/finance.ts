import express from "express";

import {
  createFinance,
  getFinances,
  getFinanceById,
  updateFinance,
  deleteFinance,
  toggleFinanceStatus,
} from "../controllers/finance.js";

const router = express.Router();

router.post("/", createFinance);
router.get("/", getFinances);
router.get("/:id", getFinanceById);
router.put("/:id", updateFinance);
router.delete("/:id", deleteFinance);

router.patch(
  "/toggle-status/:id",
  toggleFinanceStatus
);

export default router;