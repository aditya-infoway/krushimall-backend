import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "No token",
      });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Sirf check karo ki admin exist karta hai (activeToken check hata diya)
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: { id: true },
    });

    if (!admin) {
      return res.status(401).json({
        message: "Admin not found",
      });
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};