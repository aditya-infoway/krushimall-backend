// src/middlewares/verifyWebToken.ts

import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { WebAuthedRequest } from "../type/webAuthRequest.js";

interface WebTokenPayload {
  id: number;
  email: string;
  name: string;
  type: string;
}

export const verifyWebToken = (req: WebAuthedRequest, res: Response, next: NextFunction) => {
   console.log("verifyWebToken hit");
  console.log("Authorization:", req.headers.authorization);

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as WebTokenPayload;

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
  } catch (error) {
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