// src/controllers/cart.controller.ts

import { Response } from "express";
import prisma from "../../lib/prisma.js";
import { WebAuthedRequest } from "../../type/webAuthRequest.js";

const GST_RATE = 0.18;
const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_CHARGE = 99;

// ---------- helper: cart ko response ke liye calculate + format karo ----------
export const buildCartResponse = async (cart: any) => {
  const items = cart.items.map((item: any) => ({
    id: item.product.id,
    cartItemId: item.id,
    name: item.product.productName,
    image: item.product.mainImage,
    partNumber: item.product.partNumber,
    price: Number(item.product.finalPrice),
    quantity: item.quantity,
    maxOrderQuantity: item.product.maxOrderQuantity || null,
    stock: item.product.stock, // IN_STOCK | OUT_OF_STOCK
  }));

  const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);

  let discountAmount = 0;
  let appliedCoupon: {
    code: string;
    title: string;
    type: string;
    discount: number;
    displayMessage: string | null;
  } | null = null;

  if (cart.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: cart.couponCode },
      include: { products: true },
    });

    const now = new Date();

    // SPECIFIC_PRODUCTS coupon ke case mein discount ka base sirf un
    // items ka subtotal hona chahiye jo coupon.products list mein hain —
    // poora cart subtotal nahi. Isse "brake pads only" coupon apply hone
    // par bosch bearing jaisa unrelated item discount nahi paayega.
    const eligibleProductIds =
      coupon?.applyOn === "SPECIFIC_PRODUCTS"
        ? new Set(coupon.products.map((p) => p.productId))
        : null;

    const eligibleSubtotal = eligibleProductIds
      ? items.reduce(
          (sum: number, i: any) =>
            eligibleProductIds.has(i.id) ? sum + i.price * i.quantity : sum,
          0,
        )
      : subtotal;

    // minOrderValue ka base: SPECIFIC_PRODUCTS coupon ke liye sirf eligible
    // items ka subtotal check hoga, warna poora cart subtotal. Isse koi
    // unrelated cheap item add karke specific-product coupon ka threshold
    // "unlock" nahi kiya ja sakta.
    const minOrderBase =
      coupon?.applyOn === "SPECIFIC_PRODUCTS" ? eligibleSubtotal : subtotal;

    // Re-validate everything on every cart fetch — a coupon can go stale
    // (expired, deactivated, hit its usage limit) between when it was
    // applied and now, and the cart should silently drop it in that case
    // rather than keep discounting.
    const isStillValid =
      coupon &&
      coupon.status === "ACTIVE" &&
      now >= coupon.startDate &&
      now <= coupon.endDate &&
      minOrderBase >= Number(coupon.minOrderValue) &&
      (coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit) &&
      (coupon.applyOn !== "SPECIFIC_PRODUCTS" || eligibleSubtotal > 0);

    if (isStillValid && coupon) {
      appliedCoupon = {
        code: coupon.code,
        title: coupon.title,
        type: coupon.type,
        discount: Number(coupon.discountValue),
        displayMessage: coupon.displayMessage,
      };

      // Discount ab eligibleSubtotal pe calculate hoga — SPECIFIC_PRODUCTS
      // ke case mein ye sirf matching items ka sum hai, warna poora cart subtotal.
      discountAmount =
        coupon.type === "PERCENTAGE"
          ? (eligibleSubtotal * Number(coupon.discountValue)) / 100
          : Number(coupon.discountValue);

      if (coupon.type === "PERCENTAGE" && coupon.maxDiscountAmount !== null) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
      }

      // Cap bhi eligibleSubtotal se lagana hai (poore cart subtotal se nahi),
      // taaki fixed-amount coupon bhi eligible items ki value se zyada discount na de.
      discountAmount = Math.min(discountAmount, eligibleSubtotal);
    } else {
      appliedCoupon = null; // coupon ab valid nahi (expire/inactive/minOrderValue fail/no eligible item/etc)
    }
  }

  const gstAmount = subtotal * GST_RATE;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const shippingCharge = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const total = subtotal + gstAmount + shippingCharge - discountAmount;

  return { items, subtotal, cgst, sgst, shippingCharge, discountAmount, appliedCoupon, total };
};

// ---------- GET /api/cart ----------
export const getCart = async (req: WebAuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    let cart = await prisma.cart.findUnique({
      where: { webUserId: userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { webUserId: userId },
        include: { items: { include: { product: true } } },
      });
    }

    const response = await buildCartResponse(cart);
    return res.status(200).json({ success: true, cart: response });
  } catch (error) {
    console.error("getCart error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch cart" });
  }
};

// ---------- POST /api/cart/add  { productId, quantity } ----------
export const addToCart = async (req: WebAuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (product.stock === "OUT_OF_STOCK") {
      return res.status(400).json({ success: false, message: "This product is out of stock" });
    }
    if (product.verificationStatus !== "APPROVED") {
      return res.status(400).json({ success: false, message: "This product is not available" });
    }

    let cart = await prisma.cart.findUnique({ where: { webUserId: userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { webUserId: userId } });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    });

    let newQty = existingItem ? existingItem.quantity + Number(quantity) : Number(quantity);

    if (product.maxOrderQuantity && newQty > product.maxOrderQuantity) {
      newQty = product.maxOrderQuantity;
    }
    if (newQty > product.stockQuantity) {
      newQty = product.stockQuantity;
    }

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: product.id } },
      update: { quantity: newQty },
      create: { cartId: cart.id, productId: product.id, quantity: newQty },
    });

    const fullCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });
    const response = await buildCartResponse(fullCart);
    return res.status(200).json({ success: true, cart: response });
  } catch (error) {
    console.error("addToCart error:", error);
    return res.status(500).json({ success: false, message: "Failed to add item to cart" });
  }
};

// ---------- PATCH /api/cart/update  { productId, quantity } ----------
export const updateQuantity = async (req: WebAuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId, quantity } = req.body;

    const cart = await prisma.cart.findUnique({ where: { webUserId: userId } });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId: Number(productId) } });
    } else {
      await prisma.cartItem.update({
        where: { cartId_productId: { cartId: cart.id, productId: Number(productId) } },
        data: { quantity: Number(quantity) },
      });
    }

    const fullCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });
    const response = await buildCartResponse(fullCart);
    return res.status(200).json({ success: true, cart: response });
  } catch (error) {
    console.error("updateQuantity error:", error);
    return res.status(500).json({ success: false, message: "Failed to update quantity" });
  }
};

// ---------- DELETE /api/cart/remove/:productId ----------
export const removeFromCart = async (req: WebAuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId } = req.params;

    const cart = await prisma.cart.findUnique({ where: { webUserId: userId } });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId: Number(productId) } });

    const fullCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });
    const response = await buildCartResponse(fullCart);
    return res.status(200).json({ success: true, cart: response });
  } catch (error) {
    console.error("removeFromCart error:", error);
    return res.status(500).json({ success: false, message: "Failed to remove item" });
  }
};

// ---------- POST /api/cart/coupon/apply  { code } ----------
export const applyCoupon = async (req: WebAuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: "Please enter a coupon code" });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: { products: true },
    });

    if (!coupon) {
      return res.status(400).json({ success: false, message: "Invalid coupon code" });
    }

    if (coupon.status !== "ACTIVE") {
      return res.status(400).json({ success: false, message: "This coupon is inactive" });
    }

    const now = new Date();

    if (now < coupon.startDate) {
      return res.status(400).json({ success: false, message: "This coupon is not active yet" });
    }

    if (now > coupon.endDate) {
      return res.status(400).json({ success: false, message: "This coupon has expired" });
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "This coupon has reached its usage limit",
      });
    }

    const cart = await prisma.cart.findUnique({
      where: { webUserId: userId },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Your cart is empty" });
    }

    const subtotal = cart.items.reduce(
      (sum, i) => sum + Number(i.product.finalPrice) * i.quantity,
      0,
    );

    // SPECIFIC_PRODUCTS coupon ke liye eligible items ka alag subtotal
    // nikalo — minOrderValue isi base pe check hoga, poore cart subtotal
    // pe nahi. Warna ek unrelated item add karke min-order threshold
    // "unlock" ho jaata hai jabki discount usko milta hi nahi.
    let eligibleSubtotal = subtotal;
    if (coupon.applyOn === "SPECIFIC_PRODUCTS") {
      const allowedProductIds = coupon.products.map((p) => p.productId);
      const eligibleItems = cart.items.filter((item) =>
        allowedProductIds.includes(item.productId),
      );

      if (eligibleItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: "This coupon is not applicable to products in your cart",
        });
      }

      eligibleSubtotal = eligibleItems.reduce(
        (sum, i) => sum + Number(i.product.finalPrice) * i.quantity,
        0,
      );
    }

    if (eligibleSubtotal < Number(coupon.minOrderValue)) {
      return res.status(400).json({
        success: false,
        message:
          coupon.applyOn === "SPECIFIC_PRODUCTS"
            ? `Add ₹${(
                Number(coupon.minOrderValue) - eligibleSubtotal
              ).toLocaleString("en-IN")} more of eligible products to use this coupon`
            : `Minimum order value is ₹${Number(coupon.minOrderValue).toLocaleString("en-IN")}`,
      });
    }

    await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: coupon.code } });

    const fullCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });
    const response = await buildCartResponse(fullCart);
    return res.status(200).json({ success: true, cart: response });
  } catch (error) {
    console.error("applyCoupon error:", error);
    return res.status(500).json({ success: false, message: "Failed to apply coupon" });
  }
};

// ---------- DELETE /api/cart/coupon/remove ----------
export const removeCoupon = async (req: WebAuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const cart = await prisma.cart.findUnique({ where: { webUserId: userId } });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });

    const fullCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });
    const response = await buildCartResponse(fullCart);
    return res.status(200).json({ success: true, cart: response });
  } catch (error) {
    console.error("removeCoupon error:", error);
    return res.status(500).json({ success: false, message: "Failed to remove coupon" });
  }
};

// ---------- DELETE /api/cart/clear ----------
export const clearCart = async (req: WebAuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const cart = await prisma.cart.findUnique({ where: { webUserId: userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
    }
    return res.status(200).json({ success: true, message: "Cart cleared" });
  } catch (error) {
    console.error("clearCart error:", error);
    return res.status(500).json({ success: false, message: "Failed to clear cart" });
  }
};