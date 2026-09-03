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

import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";

// ==================== AVAILABLE COUPONS (storefront display) ====================
// Shows currently valid, active coupons to the customer — e.g. on the cart
// page as an "Available Offers" list — with an eligibility flag computed
// against the current cart, so the frontend can grey out / explain coupons
// that don't apply yet instead of the customer having to guess codes.

export const getAvailableCoupons = async (req: Request, res: Response) => {
  try {
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

    const result = coupons
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
      .map((c) => {
        let isEligible = true;
        let reason: string | null = null;

        if (orderSubtotal < Number(c.minOrderValue)) {
          isEligible = false;
          reason = `Add ₹${(
            Number(c.minOrderValue) - orderSubtotal
          ).toLocaleString("en-IN")} more to use this coupon`;
        }
        // SPECIFIC_PRODUCTS eligibility is already guaranteed by the
        // filter above, so no further applyOn check is needed here.

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
          reason,
        };
      });

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