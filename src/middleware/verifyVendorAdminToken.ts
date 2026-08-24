// src/middleware/verifyVendorToken.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface VendorAuthedRequest extends Request {
  vendor?: {
    vendorId: number;
    email: string;
    name?: string;
  };
}

export const verifyVendorToken = (
  req: VendorAuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
      name?: string;
      role: string;
    };

    if (decoded.role !== "vendorAdmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    req.vendor = {
      vendorId: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};