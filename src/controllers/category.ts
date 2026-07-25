import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createCategory = async (
  req: Request,
  res: Response
) => {
  try {
    // Get categoryName from either field
    const categoryName = req.body.categoryName || req.body.name;
    
    const existingCategory = await prisma.category.findFirst({
      where: {
        categoryName: categoryName,
      },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await prisma.category.create({
      data: {
        categoryName: categoryName,
        status: req.body.status || "ACTIVE",
        image: req.file?.filename || null,
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
      message: "Failed to create category",
    });
  }
};

export const getCategories = async (
  req: Request,
  res: Response
) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

export const getCategoryById = async (
  req: Request,
  res: Response
) => {
  try {
    const category = await prisma.category.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
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
      message: "Failed to fetch category",
    });
  }
};

export const updateCategory = async (
  req: Request,
  res: Response
) => {
  try {
    // Get categoryName from either field
    const categoryName = req.body.categoryName || req.body.name;
    
    const updateData: any = {
      categoryName: categoryName,
      status: req.body.status,
    };

    // Add image handling
    if (req.file) {
      updateData.image = req.file.filename;
    }

    const category = await prisma.category.update({
      where: {
        id: Number(req.params.id),
      },
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
      message: "Failed to update category",
    });
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response
) => {
  try {
    await prisma.category.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
};