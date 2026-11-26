import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

// 1. CREATE
export const createImplementModel = async (req: Request, res: Response) => {
  try {
    const { modelName, categoryId, brandId, status } = req.body;

    if (!modelName || !categoryId || !brandId) {
      return res.status(400).json({
        success: false,
        message: "Model Name, Category, and Brand are required",
      });
    }

    const existing = await prisma.implementModel.findFirst({
      where: {
        brandId: Number(brandId),
        modelName: modelName,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Model already exists for this brand",
      });
    }

    const model = await prisma.implementModel.create({
      data: {
        modelName,
        categoryId: Number(categoryId),
        brandId: Number(brandId),
        status: status || "ACTIVE",
        image: req.file?.filename || null,
      },
      include: { category: true, brand: true },
    });

    return res.status(201).json({ success: true, data: model });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to create model" });
  }
};

// 2. GET ALL
export const getImplementModels = async (req: Request, res: Response) => {
  try {
    const models = await prisma.implementModel.findMany({
      orderBy: { id: "desc" },
      include: {
        category: { select: { id: true, categoryName: true } },
        brand: { select: { id: true, brandName: true } },
      },
    });
    return res.status(200).json({ success: true, data: models });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch models" });
  }
};

// 3. GET BY ID
export const getImplementModelById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const model = await prisma.implementModel.findUnique({
      where: { id },
      include: { category: true, brand: true },
    });

    if (!model) {
      return res.status(404).json({ success: false, message: "Model not found" });
    }

    return res.status(200).json({ success: true, data: model });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch model" });
  }
};

// 4. UPDATE
export const updateImplementModel = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { modelName, categoryId, brandId, status } = req.body;

    const updateData: any = {
      modelName,
      categoryId: Number(categoryId),
      brandId: Number(brandId),
      status,
    };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const model = await prisma.implementModel.update({
      where: { id },
      data: updateData,
      include: { category: true, brand: true },
    });

    return res.status(200).json({ success: true, data: model });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to update model" });
  }
};

// 5. DELETE
export const deleteImplementModel = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.implementModel.delete({ where: { id } });
    return res.status(200).json({ success: true, message: "Model deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to delete model" });
  }
};