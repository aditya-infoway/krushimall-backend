// src/routes/vendorAdmin.ts

import { Router } from "express";
import { vendorAdminLogin } from "../controllers/vendorAdmin.js";

const router = Router();

router.post("/login", vendorAdminLogin);

export default router;