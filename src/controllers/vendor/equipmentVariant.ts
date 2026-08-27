import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";

// ============================================================
// CREATE
// ============================================================
export const createEquipmentVariant = async (
  req: Request,
  res: Response,
) => {
  try {
    const vendorAuth = (req as any).vendor;

    const vendor = await prisma.webVendor.findUnique({
      where: {
        id: vendorAuth.vendorId,
      },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const variant = await prisma.equipmentVariant.create({
      data: {
        ...req.body,

        status: "DRAFT",

        vendorId: vendor.id,
        createdById: vendorAuth.userId,
        createdBy: vendor.name,
        createdType: "VENDOR",
      },
    });

    return res.status(201).json({
      success: true,
      data: variant,
    });
  } catch (error) {
    console.error("Create Equipment Variant:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Equipment Variant",
    });
  }
};

// ============================================================
// LIST
// ============================================================
export const getEquipmentVariants = async (
  req: Request,
  res: Response,
) => {
  try {
    const vendorAuth = (req as any).vendor;

    const vendor = await prisma.webVendor.findUnique({
      where: {
        id: vendorAuth.vendorId,
      },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const variants = await prisma.equipmentVariant.findMany({
      where: {
        vendorId: vendor.id,
      },
      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: variants,
    });
  } catch (error) {
    console.error("Get Equipment Variants:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Equipment Variants",
    });
  }
};

// ============================================================
// GET BY ID
// ============================================================
export const getEquipmentVariantById = async (
  req: Request,
  res: Response,
) => {
  try {
    const vendorAuth = (req as any).vendor;

    const vendor = await prisma.webVendor.findUnique({
      where: {
        id: vendorAuth.vendorId,
      },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const variant = await prisma.equipmentVariant.findFirst({
      where: {
        id: Number(req.params.id),
        vendorId: vendor.id,
      },
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Equipment Variant not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: variant,
    });
  } catch (error) {
    console.error("Get Equipment Variant By ID:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Equipment Variant",
    });
  }
};

// ============================================================
// PUBLIC GET BY ID
// ============================================================
// No authentication.
// Only ACTIVE equipment can be viewed publicly.
// ============================================================
export const getPublicEquipmentVariantById = async (
  req: Request,
  res: Response,
) => {
  try {
    const current = await prisma.equipmentVariant.findFirst({
      where: {
        id: Number(req.params.id),
        status: "ACTIVE",
      },
    });

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

    // ========================================================
    // SIMILAR PRODUCTS
    // Same brand + same category
    // ========================================================
    const similarProducts = await prisma.equipmentVariant.findMany({
      where: {
        id: {
          not: current.id,
        },
        status: "ACTIVE",
        brandId: current.brandId,
        categoryId: current.categoryId,
      },
      take: 4,
    });

    // ========================================================
    // FILL REMAINING FROM SAME CATEGORY
    // ========================================================
    if (similarProducts.length < 4) {
      const extraProducts = await prisma.equipmentVariant.findMany({
        where: {
          id: {
            notIn: [
              current.id,
              ...similarProducts.map((item) => item.id),
            ],
          },
          status: "ACTIVE",
          categoryId: current.categoryId,
        },
        take: 4 - similarProducts.length,
      });

      similarProducts.push(...extraProducts);
    }

    // ========================================================
    // RELATED PRODUCTS
    // Same category
    // ========================================================
    const relatedProducts = await prisma.equipmentVariant.findMany({
      where: {
        id: {
          not: current.id,
        },
        status: "ACTIVE",
        categoryId: current.categoryId,
      },
      take: 8,
    });

    return res.status(200).json({
      success: true,
      data: {
        ...current,
        similarProducts,
        relatedProducts,
      },
    });
  } catch (error) {
    console.error("Get Public Equipment Variant By ID:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch equipment",
    });
  }
};

// ============================================================
// UPDATE
// ============================================================
export const updateEquipmentVariant = async (
  req: Request,
  res: Response,
) => {
  try {
    const vendorAuth = (req as any).vendor;

    const vendor = await prisma.webVendor.findUnique({
      where: {
        id: vendorAuth.vendorId,
      },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const variant = await prisma.equipmentVariant.findFirst({
      where: {
        id: Number(req.params.id),
        vendorId: vendor.id,
      },
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Equipment Variant not found",
      });
    }

    const updatedVariant = await prisma.equipmentVariant.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        ...req.body,

        // Never allow vendor ownership to be changed
        vendorId: vendor.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Equipment Variant updated successfully",
      data: updatedVariant,
    });
  } catch (error) {
    console.error("Update Equipment Variant:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update Equipment Variant",
    });
  }
};

// ============================================================
// SAVE STEP
// ============================================================
export const saveStep = async (
  req: Request,
  res: Response,
) => {
  try {
    const vendorAuth = (req as any).vendor;

    const vendor = await prisma.webVendor.findUnique({
      where: {
        id: vendorAuth.vendorId,
      },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const variant = await prisma.equipmentVariant.findFirst({
      where: {
        id: Number(req.params.id),
        vendorId: vendor.id,
      },
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Equipment Variant not found",
      });
    }

    // ========================================================
    // BODY DATA
    // ========================================================
    const bodyData: Record<string, any> = {
      ...req.body,
    };

    // ========================================================
    // FILES
    // multer.fields() returns an object:
    //
    // {
    //   frontView: [file],
    //   leftView: [file],
    //   rightView: [file]
    // }
    // ========================================================
    const files = req.files as
      | {
          [fieldname: string]: Express.Multer.File[];
        }
      | undefined;

    if (files) {
      for (const fieldName of Object.keys(files)) {
        const file = files[fieldName]?.[0];

        if (file) {
          bodyData[fieldName] = file.path.replace(/\\/g, "/");
        }
      }
    }

    // ========================================================
    // UPDATE STEP DATA
    // ========================================================
    const updatedVariant = await prisma.equipmentVariant.update({
      where: {
        id: Number(req.params.id),
      },
      data: bodyData,
    });

    return res.status(200).json({
      success: true,
      message: "Step saved successfully",
      data: updatedVariant,
    });
  } catch (error) {
    console.error("Save Equipment Variant Step Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save step",
    });
  }
};

// ============================================================
// SUBMIT
// ============================================================
export const submitEquipmentVariant = async (
  req: Request,
  res: Response,
) => {
  try {
    const vendorAuth = (req as any).vendor;

    const vendor = await prisma.webVendor.findUnique({
      where: {
        id: vendorAuth.vendorId,
      },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const variant = await prisma.equipmentVariant.findFirst({
      where: {
        id: Number(req.params.id),
        vendorId: vendor.id,
      },
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Equipment Variant not found",
      });
    }

    const updatedVariant = await prisma.equipmentVariant.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        agreed: true,
        isCompleted: true,
        status: "ACTIVE",
        currentStep:
          req.body.currentStep ?? variant.currentStep,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Equipment Variant submitted successfully",
      data: updatedVariant,
    });
  } catch (error) {
    console.error("Submit Equipment Variant:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit Equipment Variant",
    });
  }
};

// ============================================================
// DELETE
// ============================================================
export const deleteEquipmentVariant = async (
  req: Request,
  res: Response,
) => {
  try {
    const vendorAuth = (req as any).vendor;

    const vendor = await prisma.webVendor.findUnique({
      where: {
        id: vendorAuth.vendorId,
      },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const variant = await prisma.equipmentVariant.findFirst({
      where: {
        id: Number(req.params.id),
        vendorId: vendor.id,
      },
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Equipment Variant not found",
      });
    }

    await prisma.equipmentVariant.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Equipment Variant deleted successfully",
    });
  } catch (error) {
    console.error("Delete Equipment Variant:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete Equipment Variant",
    });
  }
};

// ============================================================
// LATEST EQUIPMENT
// ============================================================
export const getLatestEquipmentVariants = async (
  req: Request,
  res: Response,
) => {
  try {
    const variants = await prisma.equipmentVariant.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    });

    return res.status(200).json({
      success: true,
      data: variants,
    });
  } catch (error) {
    console.error("Get Latest Equipment Variants:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch latest equipment",
    });
  }
};

// ============================================================
// POPULAR EQUIPMENT
// ============================================================
export const getPopularEquipmentVariants = async (
  req: Request,
  res: Response,
) => {
  try {
    const variants = await prisma.equipmentVariant.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: [
        {
          enquiryCount: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 8,
    });

    return res.status(200).json({
      success: true,
      data: variants,
    });
  } catch (error) {
    console.error("Get Popular Equipment Variants:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch popular equipment",
    });
  }
};

// ============================================================
// BEST VALUE EQUIPMENT
// ============================================================
// Lowest expected price first
// ============================================================
export const getBestValueEquipmentVariants = async (
  req: Request,
  res: Response,
) => {
  try {
    const variants = await prisma.equipmentVariant.findMany({
      where: {
        status: "ACTIVE",
        expectedPrice: {
          gt: 0,
        },
      },
      orderBy: {
        expectedPrice: "asc",
      },
      take: 8,
    });

    return res.status(200).json({
      success: true,
      data: variants,
    });
  } catch (error) {
    console.error("Get Best Value Equipment Variants:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch best value equipment",
    });
  }
};

// ============================================================
// PUBLIC EQUIPMENT LIST
// ============================================================
export const getPublicEquipmentVariants = async (
  req: Request,
  res: Response,
) => {
  try {
    const variants = await prisma.equipmentVariant.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: variants,
    });
  } catch (error) {
    console.error("Get Public Equipment Variants:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch equipment",
    });
  }
};