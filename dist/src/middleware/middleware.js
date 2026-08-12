// import { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js"; // CHANGED: DB check ke liye chahiye
export const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                message: "No token",
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // CHANGED: DB me check karo ki ye abhi bhi "active" token hai
        // (matlab kahin aur se dobara login nahi hua)
        const admin = await prisma.admin.findUnique({
            where: { id: decoded.id },
            select: { activeToken: true },
        });
        if (!admin || admin.activeToken !== token) {
            return res.status(401).json({
                message: "Session expired. You have logged in from another device.",
            });
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({
            message: "Invalid token",
        });
    }
};
//# sourceMappingURL=middleware.js.map