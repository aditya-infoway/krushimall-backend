  import { Request, Response } from "express";
  import prisma from "../../lib/prisma.js";

  // Create
  export const createUsedWebsiteVariant = async (
    req: Request,
    res: Response
  ) => {
    try {
      const vendorAuth = (req as any).vendor;

      const vendor = await prisma.webVendor.findUnique({
        where: { id: vendorAuth.vendorId },
      });

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }

      const variant = await prisma.usedWebsiteVariant.create({
        data: {
          ...req.body,
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
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to create Used Website Variant",
      });
    }
  };

  // List
  export const getUsedWebsiteVariants = async (
    req: Request,
    res: Response
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

      const variants = await prisma.usedWebsiteVariant.findMany({
        where: {
          vendorId: vendor.id,
        },
        include: {
          category: true,
          brandRef: true,
          modelRef: true,
          variantRef: true,
          modelYear: true,
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
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch Used Website Variants",
      });
    }
  };

  // Get By Id
  export const getUsedWebsiteVariantById = async (
    req: Request,
    res: Response
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

      const variant = await prisma.usedWebsiteVariant.findFirst({
        where: {
          id: Number(req.params.id),
          vendorId: vendor.id,
        },
        include: {
          category: true,
          brandRef: true,
          modelRef: true,
          variantRef: true,
          modelYear: true,
        },
      });

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: "Used Website Variant not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: variant,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch Used Website Variant",
      });
    }
  };
// Add this to src/controllers/vendor/usedwebsiteVariant.ts
// (same file as getLatestUsedWebsiteVariants / getBestValueUsedWebsiteVariants)

// Public — used by the storefront detail page (UsedTractorDetails.jsx).
// No auth, no vendor-ownership scoping — any visitor can view an ACTIVE listing.
export const getPublicUsedWebsiteVariantById = async (
  req: Request,
  res: Response
) => {
  try {
    const current = await prisma.usedWebsiteVariant.findFirst({
      where: {
        id: Number(req.params.id),
        status: "ACTIVE",
      },
      include: {
        category: true,
        brandRef: true,
        modelRef: true,
        variantRef: true,
        modelYear: true,
      },
    });

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Used tractor not found",
      });
    }

    // ==========================
    // Similar Products
    // Same Brand + Same Category
    // ==========================
    const similarProducts = await prisma.usedWebsiteVariant.findMany({
      where: {
        id: {
          not: current.id,
        },
        status: "ACTIVE",
        brandId: current.brandId,
        categoryId: current.categoryId,
      },
      include: {
        brandRef: true,
        modelRef: true,
      },
      take: 4,
    });

    // Fill remaining from same category
    if (similarProducts.length < 4) {
      const extraProducts = await prisma.usedWebsiteVariant.findMany({
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
        include: {
          brandRef: true,
          modelRef: true,
        },
        take: 4 - similarProducts.length,
      });

      similarProducts.push(...extraProducts);
    }

    // ==========================
    // Related Products
    // Same Category
    // ==========================
    const relatedProducts = await prisma.usedWebsiteVariant.findMany({
      where: {
        id: {
          not: current.id,
        },
        status: "ACTIVE",
        categoryId: current.categoryId,
      },
      include: {
        brandRef: true,
        modelRef: true,
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
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch used tractor",
    });
  }
};
  // Update
  export const updateUsedWebsiteVariant = async (
    req: Request,
    res: Response
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

      const variant = await prisma.usedWebsiteVariant.findFirst({
        where: {
          id: Number(req.params.id),
          vendorId: vendor.id,
        },
      });

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: "Used Website Variant not found",
        });
      }

      const updatedVariant = await prisma.usedWebsiteVariant.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          ...req.body,
        },
        include: {
          category: true,
          brandRef: true,
          modelRef: true,
          variantRef: true,
          modelYear: true,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Used Website Variant updated successfully",
        data: updatedVariant,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to update Used Website Variant",
      });
    }
  };

  // Save Step
  // Save Step
  export const saveStep = async (req: Request, res: Response) => {
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

      const variant = await prisma.usedWebsiteVariant.findFirst({
        where: {
          id: Number(req.params.id),
          vendorId: vendor.id,
        },
      });

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: "Used Website Variant not found",
        });
      }

      // Text fields (agar koi bheje gaye ho)
      const bodyData: Record<string, any> = { ...req.body };

      // Files ko map karo — multer.fields() se req.files ek object hota hai
      // { fieldName: [ { path, filename, ... } ] }
      const files = req.files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined;

      if (files) {
        for (const fieldName of Object.keys(files)) {
          const file = files[fieldName]?.[0];
          if (file) {
            // apne upload middleware ke hisaab se path adjust karo
            // agar disk storage hai to file.path, agar sirf filename chahiye to file.filename
            bodyData[fieldName] = file.path.replace(/\\/g, "/");
          }
        }
      }

      const updatedVariant = await prisma.usedWebsiteVariant.update({
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
      console.error("❌ saveStep Error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to save step",
      });
    }
  };
  // Submit
  export const submitUsedWebsiteVariant = async (
    req: Request,
    res: Response
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

      const variant = await prisma.usedWebsiteVariant.findFirst({
        where: {
          id: Number(req.params.id),
          vendorId: vendor.id,
        },
      });

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: "Used Website Variant not found",
        });
      }

      const updatedVariant = await prisma.usedWebsiteVariant.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          agreed: true,
          isCompleted: true,
          status: "PENDING", // or "SUBMITTED" if that's your status
          currentStep: req.body.currentStep ?? variant.currentStep,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Used Website Variant submitted successfully",
        data: updatedVariant,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to submit Used Website Variant",
      });
    }
  };

  // Delete
  export const deleteUsedWebsiteVariant = async (
    req: Request,
    res: Response
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

      const variant = await prisma.usedWebsiteVariant.findFirst({
        where: {
          id: Number(req.params.id),
          vendorId: vendor.id,
        },
      });

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: "Used Website Variant not found",
        });
      }

      await prisma.usedWebsiteVariant.delete({
        where: {
          id: Number(req.params.id),
        },
      });

      return res.status(200).json({
        success: true,
        message: "Used Website Variant deleted successfully",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to delete Used Website Variant",
      });
    }
  };
  export const getLatestUsedWebsiteVariants = async (
    req: Request,
    res: Response
  ) => {
    try {
      const variants = await prisma.usedWebsiteVariant.findMany({
        where: {
          status: "ACTIVE",
        },
        include: {
          brandRef: true,
          modelRef: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
      });

      res.json({
        success: true,
        data: variants,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch latest used tractors",
      });
    }
  };
  export const getPopularUsedWebsiteVariants = async (
    req: Request,
    res: Response
  ) => {
    try {
      const variants = await prisma.usedWebsiteVariant.findMany({
        where: {
          status: "ACTIVE",
        },
        include: {
          brandRef: true,
          modelRef: true,
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

      res.json({
        success: true,
        data: variants,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch popular used tractors",
      });
    }
  };
  // Add this function to src/controllers/.../usedWebsiteVariant.ts
  // (same file as getLatestUsedWebsiteVariants / getPopularUsedWebsiteVariants)

  // export const getBestValueUsedWebsiteVariants = async (
  //   req: Request,
  //   res: Response
  // ) => {
  //   try {
  //     // Pull a wider ACTIVE pool with valid price + hp, then rank by
  //     // "value" = hp per rupee (higher is better value for money).
  //     // Prisma can't order by a computed ratio directly, so we sort in JS.
  //     const candidates = await prisma.usedWebsiteVariant.findMany({
  //       where: {
  //         status: "ACTIVE",
  //         expectedPrice: { gt: 0 },
  //         hp: { gt: 0 },
  //       },
  //       include: {
  //         brandRef: true,
  //         modelRef: true,
  //       },
  //       orderBy: {
  //         createdAt: "desc",
  //       },
  //       take: 100, // rank within a reasonably fresh pool
  //     });

  //     const ranked = candidates
  //       .map((v) => ({
  //         ...v,
  //         _valueScore: (v.hp as number) / (v.expectedPrice as number),
  //       }))
  //       .sort((a, b) => b._valueScore - a._valueScore)
  //       .slice(0, 8)
  //       .map(({ _valueScore, ...rest }) => rest);

  //     return res.json({
  //       success: true,
  //       data: ranked,
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     return res.status(500).json({
  //       success: false,
  //       message: "Failed to fetch best value used tractors",
  //     });
  //   }
  // };
  export const getBestValueUsedWebsiteVariants = async (
    req: Request,
    res: Response
  ) => {
    try {
      const variants = await prisma.usedWebsiteVariant.findMany({
        where: {
          status: "ACTIVE",
          expectedPrice: {
            gt: 0,
          },
        },
        include: {
          brandRef: true,
          modelRef: true,
        },
        orderBy: {
          expectedPrice: "asc", // Lowest price first
        },
        take: 8,
      });

      return res.json({
        success: true,
        data: variants,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch best value used tractors",
      });
    }
  };
  export const getPublicUsedWebsiteVariants = async (
  req: Request,
  res: Response
) => {
  try {
    const variants = await prisma.usedWebsiteVariant.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
           category: true, 
        brandRef: true,
        modelRef: true,
        variantRef: true,
        modelYear: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: variants,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch used tractors",
    });
  }
};