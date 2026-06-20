import { Router } from "express";

import {
  createPrefix,
  getPrefixes,
  getPrefixById,
  updatePrefix,
  deletePrefix,
} from "../controllers/profilePrefix.js";

const router = Router();

router.post("/", createPrefix);

router.get("/", getPrefixes);

router.get("/:id", getPrefixById);

router.put("/:id", updatePrefix);

router.delete("/:id", deletePrefix);

export default router;