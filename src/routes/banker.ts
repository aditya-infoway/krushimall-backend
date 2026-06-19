import express from "express";

import {
  createBanker,
  getBankers,
  getBankerById,
  updateBanker,
  deleteBanker,
  toggleBankerStatus,
} from "../controllers/banker.js";

const router = express.Router();

router.post("/", createBanker);
router.get("/", getBankers);
router.get("/:id", getBankerById);
router.put("/:id", updateBanker);
router.delete("/:id", deleteBanker);

router.patch(
  "/toggle-status/:id",
  toggleBankerStatus
);

export default router;