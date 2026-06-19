import express from "express";

import {
  createProfession,
  getProfessions,
  getProfessionById,
  updateProfession,
  deleteProfession,
  toggleProfessionStatus,
} from "../controllers/profession.js";

const router = express.Router();

router.post("/", createProfession);
router.get("/", getProfessions);
router.get("/:id", getProfessionById);
router.put("/:id", updateProfession);
router.delete("/:id", deleteProfession);

router.patch(
  "/toggle-status/:id",
  toggleProfessionStatus
);

export default router;