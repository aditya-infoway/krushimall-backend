// src/routes/web/coupon.ts

import { Router } from "express";
import {  getAvailableCoupons } from "../../controllers/web/coupon.js";

const router = Router();


router.post("/available", getAvailableCoupons);

export default router;