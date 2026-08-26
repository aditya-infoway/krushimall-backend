// src/routes/cart.routes.ts

import express from "express";
import { verifyWebToken } from "../../middleware/verifyWebToken.js";
import {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  applyCoupon,
  removeCoupon,
  clearCart,
} from "../../controllers/web/cart.js";

const router = express.Router();

router.use(verifyWebToken); // is file ki saari routes login-protected hain

router.get("/", getCart);
router.post("/add", addToCart);
router.patch("/update", updateQuantity);
router.delete("/remove/:productId", removeFromCart);
router.post("/coupon/apply", applyCoupon);
router.delete("/coupon/remove", removeCoupon);
router.delete("/clear", clearCart);

export default router;