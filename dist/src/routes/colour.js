import express from "express";
import { createColour, getColours, getColourById, updateColour, deleteColour, toggleColourStatus, updateColourCode } from "../controllers/colour.js";
import { verifyToken } from "../middleware/middleware.js";
const router = express.Router();
router.post("/", verifyToken, createColour);
router.get("/", getColours);
router.get("/:id", getColourById);
router.put("/:id", verifyToken, updateColour);
router.delete("/:id", verifyToken, deleteColour);
router.patch("/:id/toggle-status", verifyToken, toggleColourStatus);
router.patch("/:id/colour-code", verifyToken, updateColourCode);
export default router;
//# sourceMappingURL=colour.js.map