import { Response } from "express";
import prisma from "../../lib/prisma.js";
import { VendorAuthedRequest } from "../../middleware/verifyVendorToken.js";

// ============================================================
// GET VENDOR ORDERS
// GET /api/vendor/orders
// ============================================================

export const getVendorOrders = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const orders = await prisma.webOrder.findMany({
      where: {
        items: {
          some: {
            product: {
              vendorId,
            },
          },
        },
      },

      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                productName: true,
                sku: true,
                mainImage: true,
                vendorId: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    /*
     * Important:
     * One customer order can contain products from multiple vendors.
     *
     * Therefore the vendor should only receive HIS products.
     *
     * We filter the items before sending them to the vendor panel.
     */

    const vendorOrders = orders.map((order) => {
      const vendorItems = order.items.filter(
        (item) => item.product?.vendorId === vendorId,
      );

      const vendorSubtotal = vendorItems.reduce((sum, item) => {
        return sum + Number(item.price) * item.quantity;
      }, 0);

      return {
        id: order.id,
        orderNumber: order.orderNumber,

        webUserId: order.webUserId,

        fullName: order.fullName,
        phone: order.phone,
        email: order.email,

        address: order.address,
        city: order.city,
        state: order.state,
        pincode: order.pincode,
        landmark: order.landmark,

        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,

        subtotal: order.subtotal,
        cgst: order.cgst,
        sgst: order.sgst,
        shippingCharge: order.shippingCharge,
        discountAmount: order.discountAmount,

        // Only this vendor's products
        vendorSubtotal,

        totalAmount: order.totalAmount,

        createdAt: order.createdAt,
        updatedAt: order.updatedAt,

        items: vendorItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          partNumber: item.partNumber,
          price: item.price,
          quantity: item.quantity,
 itemStatus: item.itemStatus,
  cancelReason: item.cancelReason,
  cancelDescription: item.cancelDescription,
  cancelImages: item.cancelImages,
  cancelRequestedAt: item.cancelRequestedAt,
          product: item.product
            ? {
                id: item.product.id,
                productName: item.product.productName,
                sku: item.product.sku,
                mainImage: item.product.mainImage,
              }
            : null,
        })),
      };
    });

    return res.status(200).json({
      success: true,
      orders: vendorOrders,
    });
  } catch (error) {
    console.error("getVendorOrders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor orders",
    });
  }
};

// ============================================================
// UPDATE VENDOR ORDER STATUS
// PATCH /api/vendor/orders/:orderNumber/status
// ============================================================

export const updateVendorOrderStatus = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;

    const orderNumberParam = req.params.orderNumber;
    const orderNumber = Array.isArray(orderNumberParam)
      ? orderNumberParam[0]
      : orderNumberParam;

    const { status } = req.body;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: "Order number is required",
      });
    }

    const allowedStatuses = [
      "PLACED",
      "CONFIRMED",
      "PACKAGING",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
      "FAILED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    /*
     * First check that this order actually contains
     * at least one product belonging to this vendor.
     */
    const order = await prisma.webOrder.findFirst({
      where: {
        orderNumber: orderNumber,
        items: {
          some: {
            product: {
              vendorId,
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for this vendor",
      });
    }

    // COD order jab DELIVERED ho jaye,
    // payment automatically PAID mark karo
    const shouldMarkPaid =
      status === "DELIVERED" &&
      order.paymentMethod === "COD" &&
      order.paymentStatus !== "PAID";

    const updatedOrder = await prisma.webOrder.update({
      where: {
        id: order.id,
      },
      data: {
        orderStatus: status,
        ...(shouldMarkPaid
          ? {
              paymentStatus: "PAID",
            }
          : {}),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("updateVendorOrderStatus error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};