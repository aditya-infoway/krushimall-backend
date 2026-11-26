import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

// 1. CREATE
export const createImplementColour = async (req: Request, res: Response) => {
  try {
    const {
      colourName,
      colourCode,
      categoryId,
      brandId,
      modelId,
      variantId,
      status,
    } = req.body;

    if (
      !colourName ||
      !colourCode ||
      !categoryId ||
      !brandId ||
      !modelId ||
      !variantId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Colour Name, Colour Code, Category, Brand, Model, and Variant are required",
      });
    }

    const existing = await prisma.implementColour.findFirst({
      where: { variantId: Number(variantId), colourName },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Colour already exists for this variant",
      });
    }

    const colour = await prisma.implementColour.create({
      data: {
        colourName,
        colourCode,
        categoryId: Number(categoryId),
        brandId: Number(brandId),
        modelId: Number(modelId),
        variantId: Number(variantId),
        status: status || "ACTIVE",
      },
      include: { category: true, brand: true, model: true, variant: true },
    });

    return res.status(201).json({ success: true, data: colour });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create colour" });
  }
};

// 2. GET ALL
export const getImplementColours = async (req: Request, res: Response) => {
  try {
    const colours = await prisma.implementColour.findMany({
      orderBy: { id: "desc" },
      include: {
        category: { select: { id: true, categoryName: true } },
        brand: { select: { id: true, brandName: true } },
        model: { select: { id: true, modelName: true } },
        variant: { select: { id: true, variantName: true } },
      },
    });
    return res.status(200).json({ success: true, data: colours });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch colours" });
  }
};

// 3. GET BY ID
export const getImplementColourById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const colour = await prisma.implementColour.findUnique({
      where: { id },
      include: { category: true, brand: true, model: true, variant: true },
    });

    if (!colour) {
      return res
        .status(404)
        .json({ success: false, message: "Colour not found" });
    }

    return res.status(200).json({ success: true, data: colour });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch colour" });
  }
};

// 4. UPDATE
export const updateImplementColour = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const {
      colourName,
      colourCode,
      categoryId,
      brandId,
      modelId,
      variantId,
      status,
    } = req.body;

    const colour = await prisma.implementColour.update({
      where: { id },
      data: {
        colourName,
        colourCode,
        categoryId: Number(categoryId),
        brandId: Number(brandId),
        modelId: Number(modelId),
        variantId: Number(variantId),
        status,
      },
      include: { category: true, brand: true, model: true, variant: true },
    });

    return res.status(200).json({ success: true, data: colour });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update colour" });
  }
};

// 5. DELETE
export const deleteImplementColour = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.implementColour.delete({ where: { id } });
    return res
      .status(200)
      .json({ success: true, message: "Colour deleted successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete colour" });
  }
};
