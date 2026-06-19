import express from "express";

import {
  createColour,
  getColours,
  getColourById,
  updateColour,
  deleteColour,
  toggleColourStatus,
  updateColourCode
} from "../controllers/colour.js";

const router = express.Router();

router.post("/", createColour);
router.get("/", getColours);
router.get("/:id", getColourById);
router.put("/:id", updateColour);
router.delete("/:id", deleteColour);
router.patch("/:id/toggle-status", toggleColourStatus);
router.patch("/:id/colour-code", updateColourCode);
export default router;