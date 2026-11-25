import { Router } from "express";
import {
  createImplementBrand,
  getImplementBrands,
  getImplementBrandById,
  updateImplementBrand,
  deleteImplementBrand,
} from "../controllers/implementBrand.js";
import { verifyToken } from "../middleware/middleware.js";
import { verifyAnyToken } from "../middleware/verifyAnyToken.js";

const router = Router();

router.post("/", verifyToken, createImplementBrand);
router.get("/", verifyAnyToken, getImplementBrands);
router.get("/:id", verifyAnyToken, getImplementBrandById);
router.put("/:id", verifyToken, updateImplementBrand);
router.delete("/:id", verifyToken, deleteImplementBrand);

export default router;
