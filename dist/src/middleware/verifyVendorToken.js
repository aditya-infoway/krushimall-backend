// src/middleware/verifyVendorToken.ts
import jwt from "jsonwebtoken";
export const verifyVendorToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
            });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "vendor") {
            return res.status(401).json({
                success: false,
                message: "Invalid vendor token",
            });
        }
        req.vendor = {
            vendorId: decoded.vendorId,
            userId: decoded.userId,
            email: decoded.email,
        };
        next();
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: "Vendor session expired",
            });
        }
        return res.status(401).json({
            success: false,
            message: "Invalid vendor token",
        });
    }
};
//# sourceMappingURL=verifyVendorToken.js.map