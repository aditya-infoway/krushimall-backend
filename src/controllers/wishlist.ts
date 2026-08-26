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
    const { variantId, productId } = req.body;

    // ✅ Exactly ek hi type accept karo, dono ek saath ya dono missing invalid hai
    if (!variantId && !productId) {
      return res.status(400).json({
        success: false,
        message: "Either variantId or productId is required",
      });
    }

    if (variantId && productId) {
      return res.status(400).json({
        success: false,
        message: "Provide only one of variantId or productId, not both",
      });
    }

    if (variantId) {
      const existing = await prisma.wishlist.findUnique({
        where: { webUserId_variantId: { webUserId: userId, variantId: Number(variantId) } },
      });

      if (existing) {
        await prisma.wishlist.delete({ where: { id: existing.id } });
        return res.json({ success: true, wishlisted: false });
      }

      await prisma.wishlist.create({
        data: { webUserId: userId, variantId: Number(variantId) },
      });
      return res.json({ success: true, wishlisted: true });
    }

    // productId case
    const existing = await prisma.wishlist.findUnique({
      where: { webUserId_productId: { webUserId: userId, productId: Number(productId) } },
    });

    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } });
      return res.json({ success: true, wishlisted: false });
    }

    await prisma.wishlist.create({
      data: { webUserId: userId, productId: Number(productId) },
    });
    res.json({ success: true, wishlisted: true });
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