import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

// 1. CREATE
export const createImplementVariant = async (req: Request, res: Response) => {
  try {
    const { variantName, categoryId, brandId, modelId, status } = req.body;

    if (!variantName || !categoryId || !brandId || !modelId) {
      return res.status(400).json({
        success: false,
        message: "Variant Name, Category, Brand, and Model are required",
      });
    }

    const existing = await prisma.implementVariant.findFirst({
      where: { modelId: Number(modelId), variantName },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Variant already exists for this model",
      });
    }

    const variant = await prisma.implementVariant.create({
      data: {
        variantName,
        categoryId: Number(categoryId),
        brandId: Number(brandId),
        modelId: Number(modelId),
        status: status || "ACTIVE",
      },
      include: { category: true, brand: true, model: true },
    });

    return res.status(201).json({ success: true, data: variant });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create variant" });
  }
};

// 2. GET ALL
export const getImplementVariants = async (req: Request, res: Response) => {
  try {
    const variants = await prisma.implementVariant.findMany({
      orderBy: { id: "desc" },
      include: {
        category: { select: { id: true, categoryName: true } },
        brand: { select: { id: true, brandName: true } },
        model: { select: { id: true, modelName: true } },
      },
    });
    return res.status(200).json({ success: true, data: variants });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch variants" });
  }
};

// 3. GET BY ID
export const getImplementVariantById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const variant = await prisma.implementVariant.findUnique({
      where: { id },
      include: { category: true, brand: true, model: true },
    });

    if (!variant) {
      return res
        .status(404)
        .json({ success: false, message: "Variant not found" });
    }

    return res.status(200).json({ success: true, data: variant });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch variant" });
  }
};

// 4. UPDATE
export const updateImplementVariant = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { variantName, categoryId, brandId, modelId, status } = req.body;

    const variant = await prisma.implementVariant.update({
      where: { id },
      data: {
        variantName,
        categoryId: Number(categoryId),
        brandId: Number(brandId),
        modelId: Number(modelId),
        status,
      },
      include: { category: true, brand: true, model: true },
    });

    return res.status(200).json({ success: true, data: variant });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update variant" });
  }
};

// 5. DELETE
export const deleteImplementVariant = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.implementVariant.delete({ where: { id } });
    return res
      .status(200)
      .json({ success: true, message: "Variant deleted successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete variant" });
  }
};
