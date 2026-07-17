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
  employeeLogin
} from "../controllers/employee.js";
import { verifyToken } from "../middleware/middleware.js";

const router = express.Router();

router.post("/", verifyToken, createEmployee);

router.get("/departments", verifyToken, getDepartments);

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
router.post("/login", employeeLogin);
router.get("/", verifyToken, getEmployees);

router.get("/:id", verifyToken, getEmployeeById);

router.put("/:id", verifyToken, updateEmployee);

router.delete("/:id", verifyToken, deleteEmployee);

router.patch(
  "/toggle-status/:id",
  verifyToken,
  toggleEmployeeStatus
);
export default router;