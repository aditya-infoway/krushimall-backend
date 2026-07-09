import express from "express";

import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
} from "../controllers/employee.js";
import { verifyToken } from "../middleware/middleware.js";

const router = express.Router();

router.post("/", verifyToken, createEmployee);
router.get("/", verifyToken, getEmployees);
router.get("/:id", verifyToken, getEmployeeById);
router.put("/:id", verifyToken, updateEmployee);
router.delete("/:id", verifyToken, deleteEmployee);

router.patch(
  "/toggle-status/:id",
  toggleEmployeeStatus
);

export default router;