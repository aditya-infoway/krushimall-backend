import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = user?.role?.toUpperCase();

    if (role === "BRANCH" && !user?.branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID missing from token — cannot create employee",
      });
    }

    const {
      department,
      branch,
      role: employeeRole, // renamed to avoid clashing with the auth `role` above
      employeeName,
      mobileNumber,
      alternateNumber,
      email,
      password,
      status,
    } = req.body;

    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { email: req.body.email },
          { mobileNumber: req.body.mobileNumber },
        ],
      },
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message:
          existingEmployee.email === req.body.email
            ? "Email already exists"
            : "Mobile number already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await prisma.employee.create({
      data: {
        department,
        branch,
        role: employeeRole,
        employeeName,
        mobileNumber,
        alternateNumber,
        email,
        password: hashedPassword,
        status,

        createdType: role,
        createdBy: user?.name,
        branchId: role === "BRANCH" ? Number(user.branchId) : null,
      },
    });

    res.status(201).json({
      success: true,
      data: employee,
      message: "Employee created successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to create employee",
    });
  }
};

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = user?.role?.toUpperCase();

    const whereClause: any = {};

    if (role === "BRANCH") {
      whereClause.branchId = Number(user.branchId);
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      select: {
        id: true,
        department: true,
        branch: true,
        role: true,
        employeeName: true,
        mobileNumber: true,
        alternateNumber: true,
        email: true,
        status: true,
        createdAt: true,
        createdType: true,
        createdBy: true,
        branchId: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
    });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = user?.role?.toUpperCase();

    const whereClause: any = { id: Number(req.params.id) };

    if (role === "BRANCH") {
      whereClause.branchId = Number(user.branchId);
    }

    const employee = await prisma.employee.findFirst({
      where: whereClause,
      select: {
        id: true,
        department: true,
        branch: true,
        role: true,
        employeeName: true,
        mobileNumber: true,
        alternateNumber: true,
        email: true,
        status: true,
        createdAt: true,
        createdType: true,
        createdBy: true,
        branchId: true,
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch employee",
    });
  }
};
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const existingEmployee = await prisma.employee.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { email: req.body.email },
              { mobileNumber: req.body.mobileNumber },
            ],
          },
        ],
      },
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message:
          existingEmployee.email === req.body.email
            ? "Email already exists"
            : "Mobile number already exists",
      });
    }

    const updateData: any = {
      department: req.body.department,
      branch: req.body.branch,
      role: req.body.role,
      employeeName: req.body.employeeName,
      mobileNumber: req.body.mobileNumber,
      alternateNumber: req.body.alternateNumber,
      email: req.body.email,
      status: req.body.status,
    };

    // Update password only if provided
    if (req.body.password) {
      updateData.password = await bcrypt.hash(req.body.password, 10);
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      data: employee,
      message: "Employee updated successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to update employee",
    });
  }
};
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    await prisma.employee.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete employee",
    });
  }
};
export const toggleEmployeeStatus = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        status: employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      },
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};
