// src/controllers/web/coupon.ts
//
// applyCoupon used to live here, but it never touched the Cart record —
// it only validated + calculated a discount. That's why the frontend
// (which expects a full `cart` object back, matching CartContext's
// EMPTY_CART shape) wasn't actually seeing the coupon "stick".
//
// Apply logic now lives in cart.controller.ts's applyCoupon, which
// persists cart.couponCode and returns the full recalculated cart —
// the shape CartContext.jsx actually needs. This file now only handles
// the "browse available offers" list, which doesn't need to touch the
// Cart record at all.

import { Response } from "express";
import prisma from "../../lib/prisma.js";
import { WebAuthedRequest } from "../../type/webAuthRequest.js";

// ==================== AVAILABLE COUPONS (storefront display) ====================
// Shows currently valid, active coupons to the customer — e.g. on the cart
// page as an "Available Offers" list — with an eligibility flag computed
// against the current cart, so the frontend can grey out / explain coupons
// that don't apply yet instead of the customer having to guess codes.

export const getAvailableCoupons = async (req: WebAuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { cartItems, subtotal } = req.body;

    const orderSubtotal = Number(subtotal || 0);
    const now = new Date();

    const coupons = await prisma.coupon.findMany({
      where: {
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        products: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const result = await Promise.all(
      coupons
        // drop coupons that have already hit their total usage limit
        .filter((c) => c.usageLimit === null || c.usedCount < c.usageLimit)
        // for product-specific coupons, hide them from the list entirely
        // when nothing in the current cart qualifies — a "Festival Special"
        // scoped to brake pads has no business showing up (even greyed out)
        // while the customer is buying an engine bearing
        .filter((c) => {
          if (c.applyOn !== "SPECIFIC_PRODUCTS") return true;

          const allowedProductIds = c.products.map((p) => p.productId);
          return (cartItems || []).some((item: any) =>
            allowedProductIds.includes(Number(item.productId ?? item.id)),
          );
        })
        .map(async (c) => {
          // minOrderValue ka base: SPECIFIC_PRODUCTS coupon ke liye sirf
          // eligible items ka subtotal check hota hai, poore cart subtotal
          // ka nahi — warna koi unrelated item add karke threshold "unlock"
          // ho jaata hai jabki discount usko milta hi nahi (same fix jo
          // cart.controller.ts mein applyCoupon/buildCartResponse mein hai).
          let minOrderBase = orderSubtotal;
          if (c.applyOn === "SPECIFIC_PRODUCTS") {
            const allowedProductIds = c.products.map((p) => p.productId);
            minOrderBase = (cartItems || [])
              .filter((item: any) =>
                allowedProductIds.includes(Number(item.productId ?? item.id)),
              )
              .reduce(
                (sum: number, item: any) =>
                  sum + Number(item.price || 0) * Number(item.quantity || 1),
                0,
              );
          }

          // Per-user limit — kitni baar isi user ne ye coupon pehle
          // (successfully placed orders mein) use kiya hai. Ye check sabse
          // pehle hai kyunki "already used" ek alag UI state hai (button
          // "Used" dikhana hai) — min-order-value wale "not eligible yet"
          // se alag treat karna hai.
          const userUsageCount = await prisma.couponUsage.count({
            where: { couponId: c.id, webUserId: userId },
          });
          const alreadyUsedByUser = userUsageCount >= c.perUserLimit;

          let isEligible = true;
          let reason: string | null = null;

          if (alreadyUsedByUser) {
            isEligible = false;
            reason = "You've already used this coupon";
          } else if (minOrderBase < Number(c.minOrderValue)) {
            isEligible = false;
            reason = `Add ₹${(
              Number(c.minOrderValue) - minOrderBase
            ).toLocaleString("en-IN")} more ${
              c.applyOn === "SPECIFIC_PRODUCTS" ? "of eligible products " : ""
            }to use this coupon`;
          }
          // SPECIFIC_PRODUCTS eligibility (kya cart mein eligible product hai)
          // is already guaranteed by the filter above, so no further applyOn
          // check is needed here.

          return {
            code: c.code,
            title: c.title,
            type: c.type,
            discountValue: Number(c.discountValue),
            maxDiscountAmount:
              c.maxDiscountAmount !== null ? Number(c.maxDiscountAmount) : null,
            minOrderValue: Number(c.minOrderValue),
            applyOn: c.applyOn,
            displayMessage: c.displayMessage,
            isEligible,
            alreadyUsedByUser,
            reason,
          };
        }),
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get available coupons error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get available coupons",
    });
  }
};