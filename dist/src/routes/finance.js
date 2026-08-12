import express from "express";
import { createFinance, getFinances, getFinanceById, updateFinance, deleteFinance, toggleFinanceStatus, } from "../controllers/finance.js";
import { verifyToken } from "../middleware/middleware.js";
const router = express.Router();
router.post("/", verifyToken, createFinance);
router.get("/", getFinances);
router.get("/:id", getFinanceById);
router.put("/:id", verifyToken, updateFinance);
router.delete("/:id", verifyToken, deleteFinance);
router.patch("/toggle-status/:id", verifyToken, toggleFinanceStatus);
export default router;
//# sourceMappingURL=finance.js.map