import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import * as EmployeeController from "../employee.js";

// ==========================================
// HELPERS
// ==========================================

const getBranchId = (req: Request): number | null => {
  const id = Number((req as any).user?.branchId);
  return Number.isFinite(id) && id > 0 ? id : null;
};

// Branch sirf wahi employees dekh/edit/delete kar sakti hai
// jo is branch ke hain AND isi branch ne create kiye hain
const branchOwnedWhere = (branchId: number) => ({
  branchId,
  createdType: "BRANCH",
});

// Employee is branch ka (branch-created) hai ya nahi
const isOwnedByBranch = async (employeeId: number, branchId: number) => {
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      ...branchOwnedWhere(branchId),
    },
    select: { id: true },
  });

  return !!employee;
};

// ==========================================
// CREATE EMPLOYEE
// ==========================================

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const branchId = getBranchId(req);

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Valid branch ID is required",
      });
    }

    // Branch ID sirf token se aayegi
    req.body.branchId = branchId;

    // Created information
    req.body.createdType = "BRANCH";
    req.body.createdBy =
      user?.branchName || user?.employeeName || user?.name;

    return EmployeeController.createEmployee(req, res);
  } catch (error) {
    console.error("Branch Create Employee Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create employee",
    });
  }
};

// ==========================================
// GET ALL EMPLOYEES (only branch-created)
// ==========================================

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const branchId = getBranchId(req);

    if (!branchId) {
      return res.status(401).json({
        success: false,
        message: "Branch not authenticated.",
      });
    }

    const employees = await prisma.employee.findMany({
      where: branchOwnedWhere(branchId),
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
        profileImage: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error("Branch Get Employees Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
    });
  }
};

// ==========================================
// GET EMPLOYEE BY ID (only branch-created)
// ==========================================

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const branchId = getBranchId(req);

    if (!branchId) {
      return res.status(401).json({
        success: false,
        message: "Branch not authenticated.",
      });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: Number(req.params.id),
        ...branchOwnedWhere(branchId),
      },
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
        profileImage: true,
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error("Branch Get Employee Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee",
    });
  }
};

// ==========================================
// UPDATE EMPLOYEE (only branch-created)
// ==========================================

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const branchId = getBranchId(req);

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Valid branch ID is required",
      });
    }

    const allowed = await isOwnedByBranch(Number(req.params.id), branchId);

    if (!allowed) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Frontend branch change nahi kar sakta
    req.body.branchId = branchId;

    return EmployeeController.updateEmployee(req, res);
  } catch (error) {
    console.error("Branch Update Employee Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update employee",
    });
  }
};

// ==========================================
// DELETE EMPLOYEE (only branch-created)
// ==========================================

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const branchId = getBranchId(req);

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Valid branch ID is required",
      });
    }

    const allowed = await isOwnedByBranch(Number(req.params.id), branchId);

    if (!allowed) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return EmployeeController.deleteEmployee(req, res);
  } catch (error) {
    console.error("Branch Delete Employee Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete employee",
    });
  }
};

// ==========================================
// TOGGLE STATUS (only branch-created)
// ==========================================

export const toggleEmployeeStatus = async (req: Request, res: Response) => {
  try {
    const branchId = getBranchId(req);

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Valid branch ID is required",
      });
    }

    const allowed = await isOwnedByBranch(Number(req.params.id), branchId);

    if (!allowed) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return EmployeeController.toggleEmployeeStatus(req, res);
  } catch (error) {
    console.error("Branch Toggle Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};

// ==========================================
// DEPARTMENTS
// ==========================================

export const getDepartments = EmployeeController.getDepartments;

// ==========================================
// ROLES BY DEPARTMENT
// ==========================================

export const getRolesByDepartment = EmployeeController.getRolesByDepartment;

// ==========================================
// TEAM LEADS
// ==========================================

export const getTeamLeads = EmployeeController.getTeamLeads;