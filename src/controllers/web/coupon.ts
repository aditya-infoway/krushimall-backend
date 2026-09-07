
import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";



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

        let isEligible = true;
        let reason: string | null = null;

        if (minOrderBase < Number(c.minOrderValue)) {
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