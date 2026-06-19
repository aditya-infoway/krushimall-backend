import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createBanker = async (
  req: Request,
  res: Response
) => {
  try {
    const banker = await prisma.banker.create({
      data: {
        banker: req.body.banker,
        status: req.body.status || "ACTIVE",
      },
    });

    res.status(201).json({
      success: true,
      data: banker,
      message: "Banker created successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to create banker",
    });
  }
};

export const getBankers = async (
  req: Request,
  res: Response
) => {
  try {
    const bankers = await prisma.banker.findMany({
      orderBy: {
        id: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: bankers,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch bankers",
    });
  }
};

export const getBankerById = async (
  req: Request,
  res: Response
) => {
  try {
    const banker = await prisma.banker.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    res.status(200).json({
      success: true,
      data: banker,
    });
  } catch (error) {
    console.log(error);
  }
};

export const updateBanker = async (
  req: Request,
  res: Response
) => {
  try {
    const banker = await prisma.banker.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        banker: req.body.banker,
        status: req.body.status,
      },
    });

    res.status(200).json({
      success: true,
      data: banker,
      message: "Banker updated successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to update banker",
    });
  }
};

export const deleteBanker = async (
  req: Request,
  res: Response
) => {
  try {
    await prisma.banker.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    res.status(200).json({
      success: true,
      message: "Banker deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete banker",
    });
  }
};

export const toggleBankerStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const banker = await prisma.banker.findUnique({
      where: { id },
    });

    if (!banker) {
      return res.status(404).json({
        success: false,
        message: "Banker not found",
      });
    }

    const updated = await prisma.banker.update({
      where: { id },
      data: {
        status:
          banker.status === "ACTIVE"
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