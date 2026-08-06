import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const loginRole = user?.role?.toUpperCase();

    const {
      department,
      branchId: bodyBranchId,
      role: employeeRole,
      teamLeadId,
      employeeName,
      mobileNumber,
      alternateNumber,
      email,
      password,
      status,
    } = req.body;

    // Check duplicate
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { email },
          { mobileNumber },
        ],
      },
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message:
          existingEmployee.email === email
            ? "Email already exists"
            : "Mobile number already exists",
      });
    }

    // Decide which branch to use
    let finalBranchId: number;

    if (loginRole === "BRANCH") {
      if (!user.branchId) {
        return res.status(400).json({
          success: false,
          message: "Branch ID missing from token",
        });
      }

      finalBranchId = Number(user.branchId);
    } else {
      if (!bodyBranchId) {
        return res.status(400).json({
          success: false,
          message: "Please select a branch",
        });
      }

      finalBranchId = Number(bodyBranchId);
    }

    // Get branch details
    const selectedBranch = await prisma.branch.findUnique({
      where: {
        id: finalBranchId,
      },
      select: {
        branchName: true,
      },
    });

    if (!selectedBranch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await prisma.employee.create({
      data: {
        department,
        branch: selectedBranch.branchName,
        branchId: finalBranchId,
        role: employeeRole,
        teamLeadId: teamLeadId ? Number(teamLeadId) : null,
        employeeName,
        mobileNumber,
        alternateNumber,
        email,
        password: hashedPassword,
        status,
        createdType: loginRole,
        createdBy: user.employeeName || user.name,
      },
    });

    return res.status(201).json({
      success: true,
      data: employee,
      message: "Employee created successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
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
        teamLeadId: true,
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
        teamLeadId: true,
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
    const user = (req as any).user;
    const loginRole = user?.role?.toUpperCase();

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

    // Decide branch
    let finalBranchId: number;

    if (loginRole === "BRANCH") {
      finalBranchId = Number(user.branchId);
    } else {
      finalBranchId = Number(req.body.branchId);
    }

    const selectedBranch = await prisma.branch.findUnique({
      where: {
        id: finalBranchId,
      },
      select: {
        branchName: true,
      },
    });

    if (!selectedBranch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const updateData: any = {
      department: req.body.department,
      branch: selectedBranch.branchName,
      branchId: finalBranchId,
      role: req.body.role,
      teamLeadId: req.body.teamLeadId
        ? Number(req.body.teamLeadId)
        : null,
      employeeName: req.body.employeeName,
      mobileNumber: req.body.mobileNumber,
      alternateNumber: req.body.alternateNumber,
      email: req.body.email,
      status: req.body.status,
    };

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
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
    });
  }
};

export const getRolesByDepartment = async (req: Request, res: Response) => {
  try {
    const departmentId = Number(req.params.departmentId);

    const roles = await prisma.role.findMany({
      where: {
        departmentId,
      },
      orderBy: {
        roleName: "asc",
      },
    });

    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch roles",
    });
  }
};
export const getTeamLeads = async (req: Request, res: Response) => {
  try {
    const { department } = req.query;

    const teamLeads = await prisma.employee.findMany({
      where: {
        department: String(department),
        role: "Team Lead",
        status: "ACTIVE",
      },
      select: {
        id: true,
        employeeName: true,
      },
      orderBy: {
        employeeName: "asc",
      },
    });

    res.json({
      success: true,
      data: teamLeads,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed",
    });
  }
};
// employee controller
export const employeeLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { email },
    });

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: "Invalid Email",
      });
    }

    const isMatch = await bcrypt.compare(password, employee.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid Password",
      });
    }

    if (employee.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Employee is inactive",
      });
    }

    const token = jwt.sign(
      {
        id: employee.id,
        role: employee.role,
        employeeName: employee.employeeName,
         branchId: employee.branchId,    
    department: employee.department,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      },
    );

    return res.json({
      success: true,
      token,
      user: employee,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Login Failed",
    });
  }
};
