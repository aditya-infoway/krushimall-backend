import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createFinance = async (
  req: Request,
  res: Response
) => {
  try {
    const finance = await prisma.finance.create({
      data: {
        finance: req.body.finance,
        status: req.body.status || "ACTIVE",
      },
    });

    res.status(201).json({
      success: true,
      data: finance,
      message: "Finance created successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to create finance",
    });
  }
};

export const getFinances = async (
  req: Request,
  res: Response
) => {
  try {
    const finances = await prisma.finance.findMany({
      orderBy: {
        id: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: finances,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch finances",
    });
  }
};

export const getFinanceById = async (
  req: Request,
  res: Response
) => {
  try {
    const finance = await prisma.finance.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    res.status(200).json({
      success: true,
      data: finance,
    });
  } catch (error) {
    console.log(error);
  }
};

export const updateFinance = async (
  req: Request,
  res: Response
) => {
  try {
    const finance = await prisma.finance.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        finance: req.body.finance,
        status: req.body.status,
      },
    });

    res.status(200).json({
      success: true,
      data: finance,
      message: "Finance updated successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to update finance",
    });
  }
};

export const deleteFinance = async (
  req: Request,
  res: Response
) => {
  try {
    await prisma.finance.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    res.status(200).json({
      success: true,
      message: "Finance deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete finance",
    });
  }
};

export const toggleFinanceStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const finance = await prisma.finance.findUnique({
      where: { id },
    });

    if (!finance) {
      return res.status(404).json({
        success: false,
        message: "Finance not found",
      });
    }

    const updated = await prisma.finance.update({
      where: { id },
      data: {
        status:
          finance.status === "ACTIVE"
            ? "INACTIVE"
            : "ACTIVE",
      },
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};