// src/middlewares/verifyWebToken.ts
import jwt from "jsonwebtoken";
export const verifyWebToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== "web") {
            return res.status(401).json({
                success: false,
                message: "Invalid token type"
            });
        }
        // THIS is the line that makes req.user.id equal the real id from the
        // WebUser table (e.g. 1, matching the row you saw in pgAdmin).
        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name
        };
        next();
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please log in again."
            });
        }
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};
//# sourceMappingURL=verifyWebToken.js.map