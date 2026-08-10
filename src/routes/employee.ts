import express from "express";

import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
  getDepartments,
  getRolesByDepartment,
  getTeamLeads,
  employeeLogin,
} from "../controllers/employee.js";

import { verifyToken } from "../middleware/middleware.js";
import { verifyEmployeeToken } from "../middleware/employeeMiddleware.js";

const router = express.Router();

// ========================================
// ADMIN APIs - Admin token required
// ========================================

router.post(
  "/",
  verifyToken,
  createEmployee
);

router.get(
  "/departments",
  verifyToken,
  getDepartments
);

router.get(
  "/roles/department/:departmentId",
  verifyToken,
  getRolesByDepartment
);

router.get(
  "/team-leads",
  verifyToken,
  getTeamLeads
);

router.get(
  "/",
  verifyToken,
  getEmployees
);

router.put(
  "/:id",
  verifyToken,
  updateEmployee
);

router.delete(
  "/:id",
  verifyToken,
  deleteEmployee
);

router.patch(
  "/toggle-status/:id",
  verifyToken,
  toggleEmployeeStatus
);

// ========================================
// EMPLOYEE LOGIN
// No token required
// ========================================

router.post(
  "/login",
  employeeLogin
);

// ========================================
// EMPLOYEE PROFILE
// Employee token required
// ========================================

router.get(
  "/:id",
  verifyEmployeeToken,
  getEmployeeById
);

export default router;