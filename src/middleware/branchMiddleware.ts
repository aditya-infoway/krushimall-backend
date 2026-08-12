import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export const verifyBranchToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    // Check Bearer token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No branch token",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No branch token",
      });
    }

    // Verify JWT
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    );

    // Branch ID from token
    const branchId = Number(decoded.id);

    if (!branchId) {
      return res.status(401).json({
        success: false,
        message: "Branch ID missing from token",
      });
    }

    // Check branch exists
    const branch = await prisma.branch.findUnique({
      where: {
        id: branchId,
      },
      select: {
        id: true,
        branchCode: true,
        branchName: true,
        branchType: true,
        companyId: true,
        financialYearId: true,
        managerId: true,
        mobileNo: true,
        gmailId: true,
        isActive: true,
      },
    });

    if (!branch) {
      return res.status(401).json({
        success: false,
        message: "Branch not found",
      });
    }

    // Check branch active
    if (!branch.isActive) {
      return res.status(403).json({
        success: false,
        message: "Branch is inactive",
      });
    }

    // Set branch user
    (req as any).user = {
      ...decoded,

      branchId: branch.id,
      branchCode: branch.branchCode,
      branchName: branch.branchName,
      branchType: branch.branchType,

      companyId: branch.companyId,
      financialYearId: branch.financialYearId,

      managerId: branch.managerId,
      mobileNo: branch.mobileNo,
      gmailId: branch.gmailId,
    };

    next();
  } catch (error) {
    console.error("Branch Token Error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid branch token",
    });
  }
};