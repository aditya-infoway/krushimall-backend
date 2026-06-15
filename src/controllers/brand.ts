import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createBrand = async (
  req: Request,
  res: Response
) => {
  try {
    const existingBrand = await prisma.brand.findFirst({
      where: {
        brandName: req.body.brandName,
        categoryId: Number(req.body.categoryId),
      },
    });

    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: "Brand already exists",
      });
    }

    const brand = await prisma.brand.create({
      data: {
        categoryId: Number(req.body.categoryId),
        brandName: req.body.brandName,
        image: req.file?.filename || null,
        status: req.body.status || "ACTIVE",
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
      message: "Failed to create brand",
    });
  }
};

export const getBrands = async (
  req: Request,
  res: Response
) => {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        category: true,
      },
      orderBy: {
        id: "desc",
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
      message: "Failed to fetch brands",
    });
  }
};

export const getBrandById = async (
  req: Request,
  res: Response
) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        category: true,
      },
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
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
      message: "Failed to fetch brand",
    });
  }
};

export const updateBrand = async (
  req: Request,
  res: Response
) => {
  try {
    const updateData: any = {
      categoryId: Number(req.body.categoryId),
      brandName: req.body.brandName,
      status: req.body.status,
    };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const brand = await prisma.brand.update({
      where: {
        id: Number(req.params.id),
      },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update brand",
    });
  }
};

export const deleteBrand = async (
  req: Request,
  res: Response
) => {
  try {
    await prisma.brand.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete brand",
    });
  }
};