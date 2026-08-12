import { Router } from "express";
import * as EmployeeController from "../../controllers/branch/employee.js";
import { verifyBranchToken } from "../../middleware/branchMiddleware.js";
const router = Router();

// ==========================================
// MASTER DATA
// ==========================================

// Departments
router.get(
  "/departments/list",
  verifyBranchToken,
  EmployeeController.getDepartments
);

// Roles by department
router.get(
  "/roles/:departmentId",
  verifyBranchToken,
  EmployeeController.getRolesByDepartment
);

// Team leads
router.get(
  "/team-leads/list",
  verifyBranchToken,
  EmployeeController.getTeamLeads
);


// ==========================================
// EMPLOYEE LIST
// ==========================================

// Get employees
router.get(
  "/",
  verifyBranchToken,
  EmployeeController.getEmployees
);


// ==========================================
// CREATE EMPLOYEE
// ==========================================

router.post(
  "/",
  verifyBranchToken,
  EmployeeController.createEmployee
);


// ==========================================
// TOGGLE STATUS
// ==========================================

router.patch(
  "/:id/toggle-status",
  verifyBranchToken,
  EmployeeController.toggleEmployeeStatus
);


// ==========================================
// GET / UPDATE / DELETE BY ID
// ==========================================

// Get employee by ID
router.get(
  "/:id",
   verifyBranchToken,
  EmployeeController.getEmployeeById
);

// Update employee
router.put(
  "/:id",
   verifyBranchToken,
  EmployeeController.updateEmployee
);

// Delete employee
router.delete(
  "/:id",
   verifyBranchToken,
  EmployeeController.deleteEmployee
);

export default router;