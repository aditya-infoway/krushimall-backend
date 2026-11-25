import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createImplementCategory = async (req: Request, res: Response) => {
  try {
    const categoryName = req.body.categoryName || req.body.name;
    
    const existingCategory = await prisma.implementCategory.findFirst({
      where: { categoryName: categoryName },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Implement Category already exists",
      });
    }

    const category = await prisma.implementCategory.create({
      data: {
        categoryName: categoryName,
        status: req.body.status || "ACTIVE",
      },
    });

    return res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create implement category",
    });
  }
};

export const getImplementCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.implementCategory.findMany({
      orderBy: { id: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch implement categories",
    });
  }
};

export const getImplementCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await prisma.implementCategory.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Implement Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch implement category",
    });
  }
};

export const updateImplementCategory = async (req: Request, res: Response) => {
  try {
    const categoryName = req.body.categoryName || req.body.name;
    
    const updateData: any = {
      categoryName: categoryName,
      status: req.body.status,
    };

    const category = await prisma.implementCategory.update({
      where: { id: Number(req.params.id) },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update implement category",
    });
  }
};

export const deleteImplementCategory = async (req: Request, res: Response) => {
  try {
    await prisma.implementCategory.delete({
      where: { id: Number(req.params.id) },
    });

    return res.status(200).json({
      success: true,
      message: "Implement Category deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete implement category",
    });
  }
};