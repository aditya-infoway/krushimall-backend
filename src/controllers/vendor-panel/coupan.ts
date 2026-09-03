// src/controllers/vendor-panel/coupon.ts

import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { VendorAuthedRequest } from "../../middleware/verifyVendorToken.js";

// ==================== CODE GENERATION ====================

// ==================== CODE GENERATION ====================
// (Auto-generation removed — code is now entered manually by vendor.
//  Keeping only a light validator + the DB uniqueness check.)

const CODE_REGEX = /^[A-Z0-9]+$/; // only uppercase letters + digits, no spaces/symbols

const isValidCouponCode = (code: string) => CODE_REGEX.test(code);




// ==================== CREATE COUPON ====================

export const createCoupon = async (
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

    const {
      title,
      code,
      couponType, 
      discountValue,
      maxDiscountAmount,
      minOrderValue,
      maxUsageCount, 
      limitPerUser, 
      applyOn,
          applyOnIds,
      displayMessage,
      startDate,
      expiryDate, 
      isActive,
    } = req.body;

    // ==================== VALIDATION ====================

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    if (!couponType) {
      return res.status(400).json({
        success: false,
        message: "Coupon type is required",
      });
    }

    if (discountValue === undefined || discountValue === null) {
      return res.status(400).json({
        success: false,
        message: "Discount value is required",
      });
    }

    if (!startDate || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and expiry date are required",
      });
    }

    if (!applyOn) {
      return res.status(400).json({
        success: false,
        message: "Apply on is required",
      });
    }

    if (
      applyOn === "SPECIFIC_PRODUCTS" &&
      (!Array.isArray(applyOnIds) || applyOnIds.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one product",
      });
    }
      if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    const finalCode = code.trim().toUpperCase();

    if (!isValidCouponCode(finalCode)) {
      return res.status(400).json({
        success: false,
        message: "Coupon code must contain only letters and numbers (no spaces or symbols)",
      });
    }

    const existingCode = await prisma.coupon.findUnique({
      where: { code: finalCode },
    });
 if (existingCode) {
      return res.status(400).json({
        success: false,
        message: "This coupon code is already in use. Please generate a new one.",
      });
    }
    const coupon = await prisma.coupon.create({
      data: {
        vendorId,

        title: title.trim(),

        code: finalCode,

        type: couponType,

        discountValue: Number(discountValue),

        maxDiscountAmount:
          maxDiscountAmount !== undefined && maxDiscountAmount !== ""
            ? Number(maxDiscountAmount)
            : null,

        minOrderValue: minOrderValue !== undefined ? Number(minOrderValue) : 0,

        usageLimit:
          maxUsageCount !== undefined && maxUsageCount !== ""
            ? Number(maxUsageCount)
            : null,

        perUserLimit: limitPerUser !== undefined ? Number(limitPerUser) : 1,

        applyOn,
   ...(applyOn === "SPECIFIC_PRODUCTS" && {
          products: {
            create: (applyOnIds as number[]).map((productId) => ({
              productId: Number(productId),
            })),
          },
        }),
        displayMessage: displayMessage || null,

        startDate: new Date(startDate),

        endDate: new Date(expiryDate),

        status: isActive === false ? "INACTIVE" : "ACTIVE",
      },
      include: {
        products: { include: { product: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error: any) {
    console.error("Create coupon error:", error);

    // Prisma unique constraint safety net (race condition on code)
    if (error?.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "This coupon code is already in use. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create coupon",
    });
  }
};

// ==================== LIST VENDOR COUPONS ====================

export const getCoupons = async (req: VendorAuthedRequest, res: Response) => {
  try {
    const vendorId = req.vendor?.vendorId;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

       const coupons = await prisma.coupon.findMany({
      where: {
        vendorId,
      },
      include: {
        products: { include: { product: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    console.error("Get vendor coupons error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get coupons",
    });
  }
};

// ==================== GET SINGLE VENDOR COUPON ====================

export const getCouponById = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;

    const id = Number(req.params.id);

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

       const coupon = await prisma.coupon.findFirst({
      where: {
        id,
        vendorId,
      },
      include: {
        products: { include: { product: true } },
      },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error("Get vendor coupon error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get coupon",
    });
  }
};

// ==================== UPDATE VENDOR COUPON ====================

export const updateCoupon = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;

    const id = Number(req.params.id);

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

    const existing = await prisma.coupon.findFirst({
      where: {
        id,
        vendorId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    const {
      title,
      code,
      couponType,
      discountValue,
      maxDiscountAmount,
      minOrderValue,
      maxUsageCount,
      limitPerUser,
      applyOn,
        applyOnIds,
      displayMessage,
      startDate,
      expiryDate,
      isActive,
    } = req.body;

    // If the code changed, re-check uniqueness
       // If the code changed, re-check uniqueness
    let resolvedCode: string | undefined;

    if (code !== undefined) {
      const trimmedCode: string = code.trim().toUpperCase();

      if (!isValidCouponCode(trimmedCode)) {
        return res.status(400).json({
          success: false,
          message: "Coupon code must contain only letters and numbers (no spaces or symbols)",
        });
      }

      if (trimmedCode !== existing.code) {
        const codeTaken = await prisma.coupon.findUnique({
          where: { code: trimmedCode },
        });

        if (codeTaken) {
          return res.status(400).json({
            success: false,
            message: "This coupon code is already in use.",
          });
        }
      }

      resolvedCode = trimmedCode;
    }
     if (
      applyOn === "SPECIFIC_PRODUCTS" &&
      applyOnIds !== undefined &&
      (!Array.isArray(applyOnIds) || applyOnIds.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one product",
      });
    }
    const updated = await prisma.coupon.update({
      where: {
        id,
      },

      data: {
        ...(title !== undefined && {
          title: title.trim(),
        }),

        ...(resolvedCode !== undefined && {
          code: resolvedCode,
        }),

        ...(couponType !== undefined && {
          type: couponType,
        }),

        ...(discountValue !== undefined && {
          discountValue: Number(discountValue),
        }),

        ...(maxDiscountAmount !== undefined && {
          maxDiscountAmount:
            maxDiscountAmount !== "" ? Number(maxDiscountAmount) : null,
        }),

        ...(minOrderValue !== undefined && {
          minOrderValue: Number(minOrderValue),
        }),

        ...(maxUsageCount !== undefined && {
          usageLimit: maxUsageCount !== "" ? Number(maxUsageCount) : null,
        }),

        ...(limitPerUser !== undefined && {
          perUserLimit: Number(limitPerUser),
        }),

        ...(applyOn !== undefined && {
          applyOn,
        }),
  ...(applyOnIds !== undefined && {
          products: {
            deleteMany: {}, // clear old links, then re-create fresh ones below
            ...(applyOn === "SPECIFIC_PRODUCTS" && {
              create: (applyOnIds as number[]).map((productId) => ({
                productId: Number(productId),
              })),
            }),
          },
        }),
        ...(displayMessage !== undefined && {
          displayMessage: displayMessage || null,
        }),

        ...(startDate !== undefined && {
          startDate: new Date(startDate),
        }),

        ...(expiryDate !== undefined && {
          endDate: new Date(expiryDate),
        }),

              ...(isActive !== undefined && {
          status: isActive === false ? "INACTIVE" : "ACTIVE",
        }),
      },
      include: {
        products: { include: { product: true } },
      },
    });
    return res.json({
      success: true,
      message: "Coupon updated successfully",
      coupon: updated,
    });
  } catch (error: any) {
    console.error("Update vendor coupon error:", error);

    if (error?.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "This coupon code is already in use.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update coupon",
    });
  }
};

// ==================== UPDATE COUPON STATUS ====================

export const updateCouponStatus = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;

    const id = Number(req.params.id);

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const existing = await prisma.coupon.findFirst({
      where: {
        id,
        vendorId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    const updated = await prisma.coupon.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });

    return res.json({
      success: true,
      message: "Coupon status updated",
      coupon: updated,
    });
  } catch (error) {
    console.error("Update coupon status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update coupon status",
    });
  }
};

// ==================== DELETE VENDOR COUPON ====================

export const deleteCoupon = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;

    const id = Number(req.params.id);

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon ID",
      });
    }

    const existing = await prisma.coupon.findFirst({
      where: {
        id,
        vendorId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    await prisma.coupon.delete({
      where: {
        id,
      },
    });

    return res.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Delete vendor coupon error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
    });
  }
};