import express from "express";

import {
  createTractor,
  getTractors,
  getTractorById,
  updateTractor,
  toggleTractorStatus,
  deleteTractor,
} from "../controllers/tractor.js";

const router = express.Router();

router.post("/", createTractor);
router.get("/", getTractors);
router.get("/:id", getTractorById);
router.put("/:id", updateTractor);
router.patch("/:id/status", toggleTractorStatus);
router.delete("/:id", deleteTractor);

export default router;