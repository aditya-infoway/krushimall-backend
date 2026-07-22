// src/middleware/verifyVendorToken.ts

import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Request } from "express";

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

export const verifyVendorToken = (
  req: VendorAuthedRequest,
  res: Response,
  next: NextFunction
) => {
  try {


    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as VendorTokenPayload;

    if (decoded.role !== "vendor") {
      return res.status(401).json({
        success: false,
        message: "Invalid vendor token",
      });
    }

    req.vendor = {
      vendorId: decoded.vendorId,
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Vendor session expired",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid vendor token",
    });
  }
};