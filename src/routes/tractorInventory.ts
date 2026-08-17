import { Router } from "express";
import { getAdminTractorInventory } from "../controllers/tractorInventory.js";
import { verifyToken } from "../middleware/middleware.js";

const router = Router();

router.get("/", verifyToken, getAdminTractorInventory);

export default router;