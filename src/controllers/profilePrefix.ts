import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createPrefix = async (
  req: Request,
  res: Response
) => {
  try {
    const { prefixFor, prefix } = req.body;

    const existing = await prisma.profilePrefix.findUnique({
      where: {
        prefixFor,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Prefix already exists",
      });
    }

    const data = await prisma.profilePrefix.create({
      data: {
        prefixFor,
        prefix,
      },
    });

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create prefix",
    });
  }
};
export const getPrefixes = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await prisma.profilePrefix.findMany({
      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch prefixes",
    });
  }
};
export const getPrefixById = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await prisma.profilePrefix.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed",
    });
  }
};
export const updatePrefix = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await prisma.profilePrefix.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        prefixFor: req.body.prefixFor,
        prefix: req.body.prefix,
      },
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update prefix",
    });
  }
};
export const deletePrefix = async (
  req: Request,
  res: Response
) => {
  try {
    await prisma.profilePrefix.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete",
    });
  }
};