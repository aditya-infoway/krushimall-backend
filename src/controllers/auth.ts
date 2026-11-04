import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, platform } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({
        message: "Admin not found",
      });
    }

    if (admin.password !== password) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    // Web: 7 din, App: 365 din (8h se zyada comfortable)
    const expiresIn = platform === "app" ? "365d" : "7d";

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn }
    );

    // activeToken save karna hata diya: ab multiple devices/browsers
    // se same admin ek saath login reh sakta hai

    // password response mein mat bhejo
    const { password: _pw, ...safeAdmin } = admin;

    return res.json({
      token,
      user: safeAdmin,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};