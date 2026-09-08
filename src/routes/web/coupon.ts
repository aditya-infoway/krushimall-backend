// src/routes/web/coupon.ts

import { Router } from "express";
import {  getAvailableCoupons } from "../../controllers/web/coupon.js";
import { verifyWebToken } from "../../middleware/verifyWebToken.js";
const router = Router();


router.post("/available",verifyWebToken, getAvailableCoupons);

export default router;