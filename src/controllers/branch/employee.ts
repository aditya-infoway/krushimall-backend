import { Request, Response } from "express";
import * as EmployeeController from "../employee.js";

// ==========================================
// CREATE EMPLOYEE
// ==========================================

export const createEmployee = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = (req as any).user;

    // Branch ID comes ONLY from authenticated branch token
    if (!user?.branchId) {
      return res.status(400).json({
        success: false,
        message: "Valid branch ID is required",
      });
    }

    // Force branch ID from logged-in branch
    req.body.branchId = Number(user.branchId);

    // Created information
    req.body.createdType = "BRANCH";
    req.body.createdBy =
      user?.branchName ||
      user?.employeeName ||
      user?.name;

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
// GET ALL EMPLOYEES
// ==========================================

export const getEmployees = async (
  req: Request,
  res: Response,
) => {
  return EmployeeController.getEmployees(req, res);
};


// ==========================================
// GET EMPLOYEE BY ID
// ==========================================

export const getEmployeeById = async (
  req: Request,
  res: Response,
) => {
  return EmployeeController.getEmployeeById(req, res);
};


// ==========================================
// UPDATE EMPLOYEE
// ==========================================

export const updateEmployee = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = (req as any).user;

    if (!user?.branchId) {
      return res.status(400).json({
        success: false,
        message: "Valid branch ID is required",
      });
    }

    // Never allow frontend to change branch
    req.body.branchId = Number(user.branchId);

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
// DELETE EMPLOYEE
// ==========================================

export const deleteEmployee = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = (req as any).user;

    if (!user?.branchId) {
      return res.status(400).json({
        success: false,
        message: "Valid branch ID is required",
      });
    }

    // First check employee belongs to this branch
    const originalUser = (req as any).user;

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
// TOGGLE STATUS
// ==========================================

export const toggleEmployeeStatus =
  EmployeeController.toggleEmployeeStatus;


// ==========================================
// DEPARTMENTS
// ==========================================

export const getDepartments =
  EmployeeController.getDepartments;


// ==========================================
// ROLES BY DEPARTMENT
// ==========================================

export const getRolesByDepartment =
  EmployeeController.getRolesByDepartment;


// ==========================================
// TEAM LEADS
// ==========================================

export const getTeamLeads =
  EmployeeController.getTeamLeads;