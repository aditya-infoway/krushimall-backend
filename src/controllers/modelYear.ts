import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createModelYear = async (
  req: Request,
  res: Response
) => {
  try {
    const existingModelYear =
      await prisma.modelYear.findFirst({
        where: {
          modelId: Number(req.body.modelId),
          modelYear: req.body.modelYear,
        },
      });

    if (existingModelYear) {
      return res.status(400).json({
        success: false,
        message: "Model Year already exists",
      });
    }

    const modelYear =
      await prisma.modelYear.create({
        data: {
          categoryId: Number(
            req.body.categoryId
          ),

          brandId: Number(
            req.body.brandId
          ),

          modelId: Number(
            req.body.modelId
          ),

          modelYear:
            req.body.modelYear,

          image:
            req.file?.filename || null,

          status:
            req.body.status ||
            "ACTIVE",
        },
      });

    return res.status(201).json({
      success: true,
      data: modelYear,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to create model year",
    });
  }
};

export const getModelYears = async (
  req: Request,
  res: Response
) => {
  try {
    const modelYears =
      await prisma.modelYear.findMany({
        include: {
          category: true,
          brand: true,
          model: true,
        },
        orderBy: {
          id: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      data: modelYears,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch model years",
    });
  }
};

export const getModelYearById =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const modelYear =
        await prisma.modelYear.findUnique(
          {
            where: {
              id: Number(
                req.params.id
              ),
            },
            include: {
              category: true,
              brand: true,
              model: true,
            },
          }
        );

      if (!modelYear) {
        return res.status(404).json({
          success: false,
          message:
            "Model Year not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: modelYear,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch model year",
      });
    }
  };

export const updateModelYear =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const updateData: any = {
        categoryId: Number(
          req.body.categoryId
        ),

        brandId: Number(
          req.body.brandId
        ),

        modelId: Number(
          req.body.modelId
        ),

        modelYear:
          req.body.modelYear,

        status: req.body.status,
      };

      if (req.file) {
        updateData.image =
          req.file.filename;
      }

      const modelYear =
        await prisma.modelYear.update({
          where: {
            id: Number(
              req.params.id
            ),
          },
          data: updateData,
        });

      return res.status(200).json({
        success: true,
        data: modelYear,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message:
          "Failed to update model year",
      });
    }
  };

export const deleteModelYear =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      await prisma.modelYear.delete({
        where: {
          id: Number(
            req.params.id
          ),
        },
      });

      return res.status(200).json({
        success: true,
        message:
          "Model Year deleted successfully",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete model year",
      });
    }
  };