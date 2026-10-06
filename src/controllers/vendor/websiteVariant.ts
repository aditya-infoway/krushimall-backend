import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import * as WebsiteVariantController from "../websiteVariant.js";

// Create
export const createWebsiteVariant = async (req: Request, res: Response) => {
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

    // Auto mode: clonedFromId sach me vendor admin ka completed record hona chahiye
    if (req.body.entryMode === "AUTO" && req.body.clonedFromId) {
      const source = await prisma.websiteVariant.findFirst({
        where: {
          id: Number(req.body.clonedFromId),
          vendorAdminId: { not: null },
          isCompleted: true,
        },
        select: { id: true },
      });

      if (!source) {
        return res.status(400).json({
          success: false,
          message: "Invalid source variant",
        });
      }

      req.body.clonedFromId = source.id;
      req.body.entryMode = "AUTO";
    } else {
      // Manual: client ki bheji hui values ignore karo
      req.body.entryMode = "MANUAL";
      delete req.body.clonedFromId;
    }

    // Client in fields ko badal na sake
    delete req.body.vendorAdminId;

    req.body.vendorId = vendor.id;
    req.body.createdById = vendorAuth.userId;
    req.body.createdBy = vendor.name;
    req.body.createdType = "VENDOR";

    return WebsiteVariantController.createWebsiteVariant(req, res);
  } catch (error) {
    console.error("Vendor Create Website Variant:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Website Variant",
    });
  }
};

// List
export const getWebsiteVariants = async (req: Request, res: Response) => {
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

    const variants = await prisma.websiteVariant.findMany({
      where: {
        vendorId: vendor.id,
      },
      include: {
        category: true,
        brand: true,
        model: true,
        variant: true,
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
      message: "Failed to fetch Website Variants",
    });
  }
};
// Auto mode dropdown ke liye: sirf is vendor ke apne, completed variants
export const getSelectableWebsiteVariants = async (
  req: Request,
  res: Response,
) => {
  try {
    const variants = await prisma.websiteVariant.findMany({
      where: {
        vendorAdminId: { not: null }, // sirf vendor admin ke bane hue
        isCompleted: true,
      },
      include: {
        category: true,
        brand: true,
        model: true,
        variant: true,
        modelYear: true,
      },
      orderBy: { id: "desc" },
    });

    return res.status(200).json({ success: true, data: variants });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch selectable Website Variants",
    });
  }
};
// Get By Id
export const getWebsiteVariantById = async (req: Request, res: Response) => {
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

    const variant = await prisma.websiteVariant.findFirst({
      where: {
        id: Number(req.params.id),
        vendorId: vendor.id,
      },
      include: {
        category: true,
        brand: true,
        model: true,
        variant: true,
        modelYear: true,
      },
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Website Variant not found",
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
      message: "Failed to fetch Website Variant",
    });
  }
};

// Update
export const updateWebsiteVariant = async (req: Request, res: Response) => {
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

    const websiteVariant = await prisma.websiteVariant.findFirst({
      where: {
        id: Number(req.params.id),
        vendorId: vendor.id,
      },
    });

    if (!websiteVariant) {
      return res.status(404).json({
        success: false,
        message: "Website Variant not found",
      });
    }

    return WebsiteVariantController.updateWebsiteVariant(req, res);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update Website Variant",
    });
  }
};

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

    const websiteVariant = await prisma.websiteVariant.findFirst({
      where: {
        id: Number(req.params.id),
        vendorId: vendor.id,
      },
    });

    if (!websiteVariant) {
      return res.status(404).json({
        success: false,
        message: "Website Variant not found",
      });
    }

    return WebsiteVariantController.saveStep(req, res);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to save step",
    });
  }
};
// Submit
export const submitWebsiteVariant = async (req: Request, res: Response) => {
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

    const websiteVariant = await prisma.websiteVariant.findFirst({
      where: {
        id: Number(req.params.id),
        vendorId: vendor.id,
      },
    });

    if (!websiteVariant) {
      return res.status(404).json({
        success: false,
        message: "Website Variant not found",
      });
    }

    return WebsiteVariantController.submitWebsiteVariant(req, res);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit Website Variant",
    });
  }
};

// Delete
export const deleteWebsiteVariant = async (req: Request, res: Response) => {
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

    const websiteVariant = await prisma.websiteVariant.findFirst({
      where: {
        id: Number(req.params.id),
        vendorId: vendor.id,
      },
    });

    if (!websiteVariant) {
      return res.status(404).json({
        success: false,
        message: "Website Variant not found",
      });
    }

    return WebsiteVariantController.deleteWebsiteVariant(req, res);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete Website Variant",
    });
  }
};




