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

    const variants = await prisma.websiteVariant.findMany({
      where: {
        modelId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        productName: true,
        frontView: true,
        variant: {
          select: { variantName: true },
        },
      },
      orderBy: {
        productName: "asc",
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
    const id = Number(req.params.variantId);

    const tractor = await prisma.websiteVariant.findUnique({
      where: { id },
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

// =========================
// Shared helper for trending tractors (new + used)
// =========================
const getTrendingFromModel = async (
  model: any,
  options: {
    priceField: string;
    enquiryField: "count" | "field"; // "count" = _count relation, "field" = direct column like enquiryCount
    brandRelation?: string;
    modelRelation?: string;
     hasUpcoming?: boolean;
  }
) => {
  const selectClause: Record<string, any> = {
    id: true,
    productName: true,
    frontView: true,
    [options.priceField]: true,
  };

  if (options.brandRelation) {
    selectClause[options.brandRelation] = { select: { brandName: true } };
  }
  if (options.modelRelation) {
    selectClause[options.modelRelation] = { select: { modelName: true } };
  }

  if (options.enquiryField === "count") {
    selectClause._count = { select: { enquiries: true } };
  } else {
    selectClause.enquiryCount = true;
  }

 const where: any = {
  status: "ACTIVE",
  AND: [
    { frontView: { not: null } },
    { frontView: { not: "" } },
    { productName: { not: null } },
    { productName: { not: "" } },
  ],
};

if (options.hasUpcoming) {
  where.isUpcoming = false;
}

let tractors = await model.findMany({
  where,
  select: selectClause,
});

  const getEnquiryCount = (t: any) =>
    options.enquiryField === "count" ? t._count?.enquiries || 0 : t.enquiryCount || 0;

  const hasEnquiry = tractors.some((t: any) => getEnquiryCount(t) > 0);

  if (hasEnquiry) {
    tractors = tractors
      .sort((a: any, b: any) => getEnquiryCount(b) - getEnquiryCount(a))
      .slice(0, 4);
  } else {
    tractors = tractors.sort(() => Math.random() - 0.5).slice(0, 4);
  }

  return tractors;
};

// =========================
// Get Trending NEW Tractors
// =========================
export const getTrendingTractors = async (req: Request, res: Response) => {
  try {
    const tractors = await getTrendingFromModel(prisma.websiteVariant, {
      priceField: "exShowroomPrice",
      enquiryField: "count",
      brandRelation: "brand",
      modelRelation: "model",
    });

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

// =========================
// Get Trending USED Tractors
// =========================
export const getTrendingUsedTractors = async (req: Request, res: Response) => {
  try {
    const tractors = await getTrendingFromModel(prisma.usedWebsiteVariant, {
      priceField: "expectedPrice",
      enquiryField: "field", // usedWebsiteVariant has direct enquiryCount column
      brandRelation: "brandRef",
      modelRelation: "modelRef",
    });

    return res.status(200).json({
      success: true,
      data: tractors,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch trending used tractors",
    });
  }
};
// =========================
// Get USED Variant Details (by usedWebsiteVariant id)
// =========================
export const getCompareUsedVariantDetails = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.variantId);

    const tractor = await prisma.usedWebsiteVariant.findUnique({
      where: { id },
    });

    if (!tractor) {
      return res.status(404).json({
        success: false,
        message: "Used tractor not found",
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
      message: "Failed to fetch used comparison details",
    });
  }
};

// =========================
// Get USED Variants By Model (for dropdown)
// =========================
export const getCompareUsedVariants = async (req: Request, res: Response) => {
  try {
    const modelId = Number(req.params.modelId);

    const variants = await prisma.usedWebsiteVariant.findMany({
      where: {
        modelId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        productName: true,
        frontView: true,
        variantRef: {
          select: { variantName: true },
        },
      },
      orderBy: {
        productName: "asc",
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
      message: "Failed to fetch used variants",
    });
  }
};