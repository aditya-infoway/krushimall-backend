import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createWebsiteVariant = async (req: Request, res: Response) => {
  try {
    const createData: any = {
      ...req.body,
      currentStep: 1,
      status: "DRAFT",
    };

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    if (files) {
      Object.keys(files).forEach((fieldName) => {
        if (files[fieldName] && files[fieldName].length > 0) {
          createData[fieldName] = `/uploads/${files[fieldName][0].filename}`;
        }
      });
    }

    const websiteVariant = await prisma.websiteVariant.create({
      data: createData,
    });

    return res.status(201).json({
      success: true,
      data: websiteVariant,
      message: "Website Variant created successfully",
    });
  } catch (error) {
    console.error("Create Website Variant Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Website Variant",
    });
  }
};

export const getWebsiteVariants = async (
  req: Request,
  res: Response
) => {
  try {
    const variants = await prisma.websiteVariant.findMany({
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
export const getWebsiteVariantById = async (
  req: Request,
  res: Response
) => {
  try {
    const variant = await prisma.websiteVariant.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        brand: true,
        category: true,
        model: true,
        variant: true,
         modelYear: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: variant,
    });
  } catch (error) {
    console.error(error);
  }
};

export const updateWebsiteVariant = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.websiteVariant.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Website Variant not found",
      });
    }

    const updateData: any = {
      ...req.body,
    };

    // Uploaded Files
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    if (files) {
      Object.keys(files).forEach((fieldName) => {
        if (files[fieldName] && files[fieldName].length > 0) {
          updateData[fieldName] = `/uploads/${files[fieldName][0].filename}`;
        }
      });
    }

    const websiteVariant = await prisma.websiteVariant.update({
      where: {
        id,
      },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      data: websiteVariant,
      message: "Website Variant updated successfully",
    });
  } catch (error) {
    console.error("Update Website Variant Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update Website Variant",
    });
  }
};

export const saveStep = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const updateData: any = {
      ...req.body,
    };

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    if (files) {
      Object.keys(files).forEach((fieldName) => {
        if (files[fieldName] && files[fieldName].length > 0) {
          updateData[fieldName] = `/uploads/${files[fieldName][0].filename}`;
        }
      });
    }

    const websiteVariant = await prisma.websiteVariant.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      data: websiteVariant,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to save step",
    });
  }
};

export const submitWebsiteVariant = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const websiteVariant = await prisma.websiteVariant.update({
      where: { id },
      data: {
        agreed: true,
        isCompleted: true,
        status: "PENDING_REVIEW",
      },
    });

    return res.status(200).json({
      success: true,
      data: websiteVariant,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit Website Variant",
    });
  }
};

export const deleteWebsiteVariant = async (req: Request, res: Response) => {
  try {
    await prisma.websiteVariant.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Website Variant deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete Website Variant",
    });
  }
};
