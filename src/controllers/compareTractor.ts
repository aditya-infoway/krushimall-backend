import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

// =========================
// Get Brands
// =========================
export const getCompareBrands = async (req: Request, res: Response) => {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
        brandName: true,
      },
      orderBy: {
        brandName: "asc",
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

// =========================
// Get Models By Brand
// =========================
export const getCompareModels = async (req: Request, res: Response) => {
  try {
    const brandId = Number(req.params.brandId);

    const models = await prisma.model.findMany({
      where: {
        brandId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        modelName: true,
      },
      orderBy: {
        modelName: "asc",
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

// =========================
// Get Variants By Model
// =========================
export const getCompareVariants = async (req: Request, res: Response) => {
  try {
    const modelId = Number(req.params.modelId);

    const variants = await prisma.variant.findMany({
      where: {
        modelId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        variantName: true,
        image: true,
      },
      orderBy: {
        variantName: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      data: variants,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch variants",
    });
  }
};

export const getCompareVariantDetails = async (req: Request, res: Response) => {
  try {
    const variantId = Number(req.params.variantId);

    // const tractor = await prisma.websiteVariant.findFirst({
    //   where: {
    //     variantId,
    //     status: "ACTIVE",
    //   },
    //   select: {
    //     id: true,
    //     productName: true,
    //     frontView: true,
    //     exShowroomPrice: true,

    //     horsePower: true,
    //     engineType: true,
    //     fuelType: true,
    //     numberOfCylinders: true,
    //     clutchType: true,
    //     forwardGears: true,
    //     reverseGears: true,
    //     ptoHp: true,
    //     liftingCapacity: true,

    //     brand: {
    //       select: {
    //         brandName: true,
    //       },
    //     },
    //     model: {
    //       select: {
    //         modelName: true,
    //       },
    //     },
    //     variant: {
    //       select: {
    //         variantName: true,
    //       },
    //     },
    //   },
    // });

    const tractor = await prisma.websiteVariant.findFirst({
      where: {
        variantId,
      },
    });

    if (!tractor) {
      return res.status(404).json({
        success: false,
        message: "Tractor not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: tractor,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch comparison details",
    });
  }
};

// existing compare controller
export const getTrendingTractors = async (req: Request, res: Response) => {
  try {
    let tractors = await prisma.websiteVariant.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
        productName: true,
        frontView: true,
        horsePower: true,
        exShowroomPrice: true,

        _count: {
          select: {
            enquiries: true,
          },
        },
      },
    });

    const hasEnquiry = tractors.some((tractor) => tractor._count.enquiries > 0);

    if (hasEnquiry) {
      tractors = tractors
        .sort((a, b) => b._count.enquiries - a._count.enquiries)
        .slice(0, 3);
    } else {
      tractors = tractors.sort(() => Math.random() - 0.5).slice(0, 3);
    }

    return res.status(200).json({
      success: true,
      data: tractors,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch trending tractors",
    });
  }
};
