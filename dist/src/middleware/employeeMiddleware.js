import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
export const verifyEmployeeToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No employee token",
            });
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No employee token",
            });
        }
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Check employee exists
        const employee = await prisma.employee.findUnique({
            where: {
                id: Number(decoded.id),
            },
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
        // Check employee status
        if (employee.status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message: "Employee is inactive",
            });
        }
        // Set employee user
        req.user = {
            ...decoded,
            employeeId: employee.id,
            employeeName: employee.employeeName,
            email: employee.email,
            role: employee.role,
            branchId: employee.branchId,
            department: employee.department,
        };
        next();
    }
    catch (error) {
        console.error("Employee Token Error:", error);
        return res.status(401).json({
            success: false,
            message: "Invalid employee token",
        });
    }
};
//# sourceMappingURL=employeeMiddleware.js.map