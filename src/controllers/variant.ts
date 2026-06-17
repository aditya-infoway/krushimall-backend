import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createVariant = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      categoryId,
      brandId,
      modelId,
      modelYearId,
      variantCode,
      variantName,
      status,
    } = req.body;

    const existingVariant =
      await prisma.variant.findUnique({
        where: { variantCode },
      });

    if (existingVariant) {
      return res.status(400).json({
        success: false,
        message: "Variant Code already exists",
      });
    }

    const image = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    const variant = await prisma.variant.create({
      data: {
        categoryId: Number(categoryId),
        brandId: Number(brandId),
        modelId: Number(modelId),
        modelYearId: Number(modelYearId),
        variantCode,
        variantName,
        image,
        status: status || "ACTIVE",
      },
    });

    return res.status(201).json({
      success: true,
      data: variant,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const updateVariant = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const {
      categoryId,
      brandId,
      modelId,
      modelYearId,
      variantCode,
      variantName,
      status,
    } = req.body;

    const existingVariant =
      await prisma.variant.findUnique({
        where: { id },
      });

    if (!existingVariant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    const existingCode =
      await prisma.variant.findFirst({
        where: {
          variantCode,
          NOT: { id },
        },
      });

    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: "Variant Code already exists",
      });
    }

    const image = req.file
      ? `/uploads/${req.file.filename}`
      : existingVariant.image;

    const variant = await prisma.variant.update({
      where: { id },
      data: {
        categoryId: Number(categoryId),
        brandId: Number(brandId),
        modelId: Number(modelId),
        modelYearId: Number(modelYearId),
        variantCode,
        variantName,
        image,
        status,
      },
    });

    return res.status(200).json({
      success: true,
      data: variant,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const getVariants = async (
  req: Request,
  res: Response
) => {
  try {
    const variants = await prisma.variant.findMany({
      include: {
        category: true,
        brand: true,
        model: true,
        modelYear: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).json(variants);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const getVariantById = async (
  req: Request,
  res: Response
) => {
  try {
    const variant = await prisma.variant.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        category: true,
        brand: true,
        model: true,
        modelYear: true,
      },
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    return res.status(200).json(variant);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const deleteVariant = async (
  req: Request,
  res: Response
) => {
  try {
    await prisma.variant.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Variant deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};