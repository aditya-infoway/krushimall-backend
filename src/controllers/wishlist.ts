import { Response } from "express";
import prisma from "../lib/prisma.js";
import { WebAuthedRequest } from "../type/webAuthRequest.js";

export const getWishlist = async (req: WebAuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const items = await prisma.wishlist.findMany({
      where: { webUserId: userId },
      include: {
        variant: { include: { brand: true } },
        product: { include: { brand: true, category: true } },   // ✅ product bhi include karo
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: items });
  } catch (error) {
    console.error("Get wishlist error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch wishlist" });
  }
};

export const toggleWishlist = async (req: WebAuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { variantId, productId, usedVariantId } = req.body;

    const providedCount = [variantId, productId, usedVariantId].filter(Boolean).length;

    if (providedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "One of variantId, productId or usedVariantId is required",
      });
    }
    if (providedCount > 1) {
      return res.status(400).json({
        success: false,
        message: "Provide only one of variantId, productId or usedVariantId",
      });
    }

    if (usedVariantId) {
      const existing = await prisma.wishlist.findUnique({
        where: { webUserId_usedVariantId: { webUserId: userId, usedVariantId: Number(usedVariantId) } },
      });

      if (existing) {
        await prisma.wishlist.delete({ where: { id: existing.id } });
        return res.json({ success: true, wishlisted: false });
      }

      await prisma.wishlist.create({
        data: { webUserId: userId, usedVariantId: Number(usedVariantId) },
      });
      return res.json({ success: true, wishlisted: true });
    }

    if (variantId) {
      // ... existing variant logic same rahega
    }

    // ... existing productId logic same rahega
  } catch (error) {
    console.error("Toggle wishlist error:", error);
    res.status(500).json({ success: false, message: "Failed to update wishlist" });
  }
};

export const clearWishlist = async (req: WebAuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await prisma.wishlist.deleteMany({ where: { webUserId: userId } });
    res.json({ success: true });
  } catch (error) {
    console.error("Clear wishlist error:", error);
    res.status(500).json({ success: false, message: "Failed to clear wishlist" });
  }
};