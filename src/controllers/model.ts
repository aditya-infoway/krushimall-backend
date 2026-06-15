import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createModel = async (
  req: Request,
  res: Response
) => {
  try {
    const existingModel = await prisma.model.findFirst({
      where: {
        modelName: req.body.modelName,
        brandId: Number(req.body.brandId),
      },
    });

    if (existingModel) {
      return res.status(400).json({
        success: false,
        message: "Model already exists",
      });
    }

    const model = await prisma.model.create({
      data: {
        categoryId: Number(req.body.categoryId),
        brandId: Number(req.body.brandId),

        modelName: req.body.modelName,

        image: req.file?.filename || null,

        status: req.body.status || "ACTIVE",
      },
    });

    return res.status(201).json({
      success: true,
      data: model,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create model",
    });
  }
};

export const getModels = async (
  req: Request,
  res: Response
) => {
  try {
    const models = await prisma.model.findMany({
      include: {
        category: true,
        brand: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: models,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch models",
    });
  }
};

export const getModelById = async (
  req: Request,
  res: Response
) => {
  try {
    const model = await prisma.model.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        category: true,
        brand: true,
      },
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Model not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: model,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch model",
    });
  }
};

export const updateModel = async (
  req: Request,
  res: Response
) => {
  try {
    const updateData: any = {
      categoryId: Number(req.body.categoryId),
      brandId: Number(req.body.brandId),
      modelName: req.body.modelName,
      status: req.body.status,
    };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const model = await prisma.model.update({
      where: {
        id: Number(req.params.id),
      },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      data: model,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update model",
    });
  }
};

export const deleteModel = async (
  req: Request,
  res: Response
) => {
  try {
    await prisma.model.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Model deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete model",
    });
  }
};