import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createImplementBrand = async (req: Request, res: Response) => {
  try {
    const { brandName, categoryId, status } = req.body;

    // Check duplicate within the same category
    const existing = await prisma.implementBrand.findFirst({
      where: {
        brandName: brandName,
        categoryId: Number(categoryId),
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Brand already exists in this category",
      });
    }

    const brand = await prisma.implementBrand.create({
      data: {
        brandName,
        categoryId: Number(categoryId),
        status: status || "ACTIVE",
      },
      include: {
        category: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create implement brand",
    });
  }
};

export const getImplementBrands = async (req: Request, res: Response) => {
  try {
    const brands = await prisma.implementBrand.findMany({
      orderBy: { id: "desc" },
      include: {
        category: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch implement brands",
    });
  }
};

export const getImplementBrandById = async (req: Request, res: Response) => {
  try {
    const brand = await prisma.implementBrand.findUnique({
      where: { id: Number(req.params.id) },
      include: { category: true },
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Implement Brand not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch implement brand",
    });
  }
};

export const updateImplementBrand = async (req: Request, res: Response) => {
  try {
    const { brandName, categoryId, status } = req.body;

    const brand = await prisma.implementBrand.update({
      where: { id: Number(req.params.id) },
      data: {
        brandName,
        categoryId: Number(categoryId),
        status,
      },
      include: {
        category: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update implement brand",
    });
  }
};

export const deleteImplementBrand = async (req: Request, res: Response) => {
  try {
    await prisma.implementBrand.delete({
      where: { id: Number(req.params.id) },
    });

    return res.status(200).json({
      success: true,
      message: "Implement Brand deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete implement brand",
    });
  }
};