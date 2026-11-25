import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

// 1. CREATE
export const createImplement = async (req: Request, res: Response) => {
  try {
    const {
      operationType,
      itemCode,
      itemName,
      hsnCode,
      unit,
      chassisNo,
      engineNo,
      serialNo,
      status,
    } = req.body;

    if (!itemCode || !itemName || !operationType) {
      return res.status(400).json({
        success: false,
        message: "Item Code, Item Name, and Operation Type are required",
      });
    }

    const existing = await prisma.implement.findFirst({
      where: {
        OR: [{ itemCode }, { itemName }],
      },
    });

    if (existing) {
      const field = existing.itemCode === itemCode ? "Item Code" : "Item Name";
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    const implement = await prisma.implement.create({
      data: {
        operationType,
        itemCode,
        itemName,
        hsnCode,
        unit,
        chassisNo: operationType === "SELF_OPERATED" ? chassisNo : null,
        engineNo: operationType === "SELF_OPERATED" ? engineNo : null,
        serialNo,
        status: status || "ACTIVE",
      },
    });

    return res.status(201).json({ success: true, data: implement });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to create implement" });
  }
};

// 2. GET ALL
export const getImplements = async (req: Request, res: Response) => {
  try {
    const implementsList = await prisma.implement.findMany({
      orderBy: { id: "desc" },
    });
    return res.status(200).json({ success: true, data: implementsList });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch implements" });
  }
};

// 3. GET BY ID
export const getImplementById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const implement = await prisma.implement.findUnique({ where: { id } });

    if (!implement) {
      return res.status(404).json({ success: false, message: "Implement not found" });
    }

    return res.status(200).json({ success: true, data: implement });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch implement" });
  }
};

// 4. UPDATE
export const updateImplement = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const {
      operationType,
      itemCode,
      itemName,
      hsnCode,
      unit,
      chassisNo,
      engineNo,
      serialNo,
      status,
    } = req.body;

    const existing = await prisma.implement.findFirst({
      where: {
        id: { not: id },
        OR: [{ itemCode }, { itemName }],
      },
    });

    if (existing) {
      const field = existing.itemCode === itemCode ? "Item Code" : "Item Name";
      return res.status(400).json({
        success: false,
        message: `${field} already exists on another implement`,
      });
    }

    const implement = await prisma.implement.update({
      where: { id },
      data: {
        operationType,
        itemCode,
        itemName,
        hsnCode,
        unit,
        chassisNo: operationType === "SELF_OPERATED" ? chassisNo : null,
        engineNo: operationType === "SELF_OPERATED" ? engineNo : null,
        serialNo,
        status,
      },
    });

    return res.status(200).json({ success: true, data: implement });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to update implement" });
  }
};

// 5. DELETE
export const deleteImplement = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.implement.delete({ where: { id } });
    return res.status(200).json({ success: true, message: "Implement deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to delete implement" });
  }
};