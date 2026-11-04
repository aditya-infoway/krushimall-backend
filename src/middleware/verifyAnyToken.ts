import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

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
      // activeToken check hata diya, sirf admin exist karta hai ya nahi
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: { id: true },
      });

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Admin not found",
        });
      }

      (req as any).user = decoded;
      return next();
    }

    if (role === "BRANCH") {
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

    if (role === "VENDORADMIN") {
      (req as any).user = {
        ...decoded,
        vendorId: decoded.id,
        email: decoded.email,
        name: decoded.name,
      };

      (req as any).vendor = {
        vendorId: decoded.id,
        email: decoded.email,
        name: decoded.name,
      };

      return next();
    }

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