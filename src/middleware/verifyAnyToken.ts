import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

// ✅ Sirf un routes ke liye jo Admin + Branch + Employee teeno
// access karte hain (jaise /leads, /leads/:id, /booking-balance, etc.)
// Role-specific routes ke liye APNA WAHI purana dedicated middleware use
// karo (verifyToken -> Admin only, verifyEmployeeToken -> Employee only,
// verifyBranchToken -> Branch only) — unhe touch mat karo.

export const verifyAnyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const role = decoded?.role?.toUpperCase();

    if (role === "ADMIN") {
      // ── Admin: same check jo verifyToken karta hai ──
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: { activeToken: true },
      });

      if (!admin || admin.activeToken !== token) {
        return res.status(401).json({
          success: false,
          message: "Session expired. You have logged in from another device.",
        });
      }

      (req as any).user = decoded;
      return next();
    }

    if (role === "BRANCH") {
      // ── Branch: same check jo verifyBranchToken karta hai ──
      const branchId = Number(decoded.id);

      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
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

      if (!branch.isActive) {
        return res.status(403).json({
          success: false,
          message: "Branch is inactive",
        });
      }

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
      return next();
    }

    // ── Employee (Sales Executive / Team Lead / etc.): same check
    //    jo verifyEmployeeToken karta hai ──
    const employee = await prisma.employee.findUnique({
      where: { id: Number(decoded.id) },
      select: {
        id: true,
        employeeName: true,
        email: true,
        role: true,
        branchId: true,
        department: true,
        status: true,
      },
    });

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (employee.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Employee is inactive",
      });
    }

    (req as any).user = {
      ...decoded,
      employeeId: employee.id,
      employeeName: employee.employeeName,
      email: employee.email,
      role: employee.role,
      branchId: employee.branchId,
      department: employee.department,
    };
    next();
  } catch (error) {
    console.error("Token Error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};