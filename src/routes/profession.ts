import express from "express";

import {
  createProfession,
  getProfessions,
  getProfessionById,
  updateProfession,
  deleteProfession,
  toggleProfessionStatus,
} from "../controllers/profession.js";
import { verifyToken } from "../middleware/middleware.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";
const router = express.Router();

router.post("/",    verifyToken, createProfession);
router.get("/",verifyAnyToken,     getProfessions);
router.get("/:id",  verifyAnyToken,  getProfessionById);
router.put("/:id",   verifyToken, updateProfession);
router.delete("/:id",   verifyToken, deleteProfession);

router.patch(
  "/toggle-status/:id",
     verifyToken,
  toggleProfessionStatus
);

export default router;