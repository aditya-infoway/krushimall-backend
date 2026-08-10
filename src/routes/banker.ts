import express from "express";

import {
  createBanker,
  getBankers,
  getBankerById,
  updateBanker,
  deleteBanker,
  toggleBankerStatus,
} from "../controllers/banker.js";
import { verifyToken } from "../middleware/middleware.js";
const router = express.Router();

router.post("/",verifyToken, createBanker);
router.get("/",verifyToken, getBankers);
router.get("/:id",verifyToken, getBankerById);
router.put("/:id",verifyToken, updateBanker);
router.delete("/:id",verifyToken, deleteBanker);

router.patch(
  "/toggle-status/:id",
  verifyToken,
  toggleBankerStatus
);

export default router;