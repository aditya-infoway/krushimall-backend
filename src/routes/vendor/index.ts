import { Router } from "express";
import websiteVariantRoutes from "./websiteVariant.js";

const router = Router();

router.use("/website-variant", websiteVariantRoutes);

export default router;