// src/middleware/verifyVendorToken.ts

import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Request } from "express";
import prisma from "../lib/prisma.js";

export interface VendorAuthedRequest extends Request {
  vendor?: {
    vendorId: number;
    userId: number;
    email: string;
  };
}

interface VendorTokenPayload {
  vendorId: number;
  userId: number;
  email: string;
  role: string;
}

export const verifyVendorToken = async (
  req: VendorAuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    // ==============================
    // 1. CHECK TOKEN
    // ==============================

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
        logout: true,
      });
    }

    const token = authHeader.split(" ")[1];

    // ==============================
    // 2. VERIFY JWT
    // ==============================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    ) as VendorTokenPayload;

    if (decoded.role !== "vendor") {
      return res.status(401).json({
        success: false,
        message: "Invalid vendor token",
        logout: true,
      });
    }

    // ==============================
    // 3. CHECK VENDOR IN DATABASE
    // ==============================

    const vendor = await prisma.webVendor.findUnique({
      where: {
        id: Number(decoded.vendorId),
      },
      select: {
        id: true,
        userId: true,
        email: true,
        status: true,
        isVerified: true,
      },
    });

    if (!vendor) {
      return res.status(401).json({
        success: false,
        message: "Vendor account not found",
        logout: true,
      });
    }

    // ==============================
    // 4. CHECK VENDOR STATUS
    // ==============================

    if (vendor.status !== "ACTIVE") {
      return res.status(401).json({
        success: false,
        message: "Your vendor account is no longer active.",
        status: vendor.status,
        logout: true,
      });
    }

    // ==============================
    // 5. CHECK OTP VERIFICATION
    // ==============================

    if (!vendor.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Vendor account is not verified.",
        logout: true,
      });
    }

    // ==============================
    // 6. SET VENDOR DATA
    // ==============================

    req.vendor = {
      vendorId: vendor.id,
      userId: vendor.userId,
      email: vendor.email,
    };

    // ==============================
    // 7. CONTINUE
    // ==============================

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Vendor session expired",
        logout: true,
      });
    }

    console.error("Vendor token verification error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid vendor token",
      logout: true,
    });
  }
};