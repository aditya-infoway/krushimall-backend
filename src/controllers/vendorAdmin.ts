// src/controllers/vendorAdmin.ts

import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const vendorAdminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password, platform } = req.body;

    const vendorAdmin = await prisma.vendorAdmin.findUnique({
      where: { email },
    });

    if (!vendorAdmin) {
      return res.status(401).json({
        message: "Vendor admin not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, vendorAdmin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    const expiresIn = platform === "app" ? "365d" : "8h";

    const token = jwt.sign(
      {
        id: vendorAdmin.id,
        email: vendorAdmin.email,
        name: vendorAdmin.name,
        role: "vendorAdmin",
      },
      process.env.JWT_SECRET!,
      { expiresIn }
    );

    const { password: _password, ...vendorAdminWithoutPassword } = vendorAdmin;

    return res.json({
      token,
      user: vendorAdminWithoutPassword,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};