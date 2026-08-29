// src/controllers/order.controller.ts

import { Response } from "express";
import prisma from "../../lib/prisma.js";
import { WebAuthedRequest } from "../../type/webAuthRequest.js";
import { buildCartResponse } from "./cart.js";

const generateOrderNumber = () => {
  return (
    "ORD-" +
    Date.now().toString(36).toUpperCase() +
    "-" +
    Math.floor(100 + Math.random() * 900)
  );
};

// ---------- POST /api/orders/place ----------
// body: { fullName, phone, email, address, city, state, pincode, landmark, paymentMethod }
export const placeOrder = async (req: WebAuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      fullName,
      phone,
      email,
      address,
       country,
      city,
      state,
      pincode,
      landmark,
      paymentMethod = "COD",
    } = req.body;

    if (
      !fullName ||
      !phone ||
      !email ||
      !address ||
      !city ||
      !state ||
      !pincode
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All shipping fields are required" });
    }

    // ⚠️ Abhi sirf COD. Razorpay/PayU integrate karoge tab yahan
    // gateway-order-create + verify step add hoga, paymentStatus
    // PENDING -> PAID webhook/verify ke baad set hoga.
    if (paymentMethod !== "COD") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Only Cash on Delivery is available right now",
        });
    }

    const cart = await prisma.cart.findUnique({
      where: { webUserId: userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Your cart is empty" });
    }

    // server-side dobara calculate — frontend numbers par bharosa mat karo
    const calculated = await buildCartResponse(cart);

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.webOrder.create({
        data: {
          orderNumber: generateOrderNumber(),
          webUserId: userId,
          subtotal: calculated.subtotal,
          cgst: calculated.cgst,
          sgst: calculated.sgst,
          shippingCharge: calculated.shippingCharge,
          discountAmount: calculated.discountAmount,
          couponCode: calculated.appliedCoupon?.code || null,
          totalAmount: calculated.total,
          paymentMethod: "COD",
          paymentStatus: "PENDING",
          orderStatus: "PLACED",
          fullName,
          phone,
          email,
          address,
            country: country || "India",
          city,
          state,
          pincode,
          landmark: landmark || null,
          items: {
            create: calculated.items.map(
              (item: {
                id: number;
                name: string;
                partNumber: string;
                price: number;
                quantity: number;
              }) => ({
                productId: item.id,
                productName: item.name,
                partNumber: item.partNumber,
                price: item.price,
                quantity: item.quantity,
              }),
            ),
          },
        },
        include: { items: true },
      });

      // stock ghatao har product ka
      for (const item of calculated.items) {
        await tx.product.update({
          where: { id: item.id },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      // order confirm hote hi cart clear + coupon reset
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { couponCode: null },
      });

      return newOrder;
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: {
        orderId: order.orderNumber,
        totalAmount: Number(order.totalAmount),
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
      },
    });
  } catch (error) {
    console.error("placeOrder error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to place order" });
  }
};

// ---------- GET /api/orders/my-orders ----------
export const getMyOrders = async (req: WebAuthedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const orders = await prisma.webOrder.findMany({
      where: {
        webUserId: userId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                mainImage: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedOrders = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        image: item.product?.mainImage || null,
      })),
    }));

    return res.status(200).json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("getMyOrders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

// ---------- GET /api/orders/:orderNumber ----------
export const getOrderByNumber = async (
  req: WebAuthedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const orderNumber = String(req.params.orderNumber);

    const order = await prisma.webOrder.findFirst({
      where: {
        orderNumber,
        webUserId: userId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                mainImage: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Convert product.mainImage -> item.image
    const formattedOrder = {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        image: item.product?.mainImage || null,
      })),
    };

    return res.status(200).json({
      success: true,
      order: formattedOrder,
    });
  } catch (error) {
    console.error("getOrderByNumber error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

// ---------- PATCH /api/orders/cancel ----------
// multipart/form-data body: { orderNumber, itemId, reason, description, images[] (max 5) }
// route pe pehle `uploadCancelImages` middleware lagana hoga (multer.array("images", 5))
export const cancelOrderItem = async (
  req: WebAuthedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const { orderNumber, itemId, reason, description } = req.body;

    if (!orderNumber || !itemId || !reason) {
      return res.status(400).json({
        success: false,
        message: "orderNumber, itemId and reason are required",
      });
    }

    // order fetch karo aur confirm karo ki yeh isi user ka hai
    const order = await prisma.webOrder.findFirst({
      where: {
        orderNumber: String(orderNumber),
        webUserId: userId,
      },
      include: { items: true },
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const item = order.items.find((i) => i.id === Number(itemId));

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Order item not found" });
    }

    if (item.itemStatus === "CANCELLED") {
      return res
        .status(400)
        .json({ success: false, message: "This item is already cancelled" });
    }

    // uploaded images (agar bheji ho) ke public paths
    // ⚠️ apka existing `upload` middleware sab files flat "uploads/" folder mein
    // save karta hai (destination: uploadDir = "uploads"), isliye path bhi flat hi rakha hai
    const files = (req.files as Express.Multer.File[]) || [];
    const imagePaths = files.map((file) => `/uploads/${file.filename}`);

    const updatedItem = await prisma.webOrderItem.update({
      where: { id: item.id },
      data: {
        itemStatus: "CANCELLED",
        cancelReason: reason,
        cancelDescription: description || null,
        cancelImages: imagePaths.length ? imagePaths : undefined,
        cancelRequestedAt: new Date(),
      },
    });

    // agar order ke saare items cancel ho chuke hain, order-level status bhi CANCELLED kar do
    const allItems = await prisma.webOrderItem.findMany({
      where: { orderId: order.id },
    });
    const allCancelled = allItems.every((i) => i.itemStatus === "CANCELLED");

    if (allCancelled) {
      await prisma.webOrder.update({
        where: { id: order.id },
        data: { orderStatus: "CANCELLED" },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Item cancellation request submitted",
      item: updatedItem,
    });
  } catch (error) {
    console.error("cancelOrderItem error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to cancel item" });
  }
};