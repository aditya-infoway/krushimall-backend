import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { VendorAuthedRequest } from "../../middleware/verifyVendorAdminToken.js";

// ==================== LIST (PUBLIC — storefront ke liye) ====================

// ==================== LIST — ADMIN (apni subcategories, sab status) ====================

export const getVendorSubCategories = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;

    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const subCategories = await prisma.vendorSubCategory.findMany({
      where: { vendorId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: subCategories });
  } catch (error) {
    console.error("Get vendor subcategories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get subcategories",
    });
  }
};

// ==================== LIST — STOREFRONT (public, sab vendors, sirf active) ====================

export const getPublicVendorSubCategories = async (req: Request, res: Response) => {
  try {
    const subCategories = await prisma.vendorSubCategory.findMany({
      where: { status: "ACTIVE" },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: subCategories });
  } catch (error) {
    console.error("Get public subcategories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get subcategories",
    });
  }
};

// ==================== GET SINGLE (PUBLIC) ====================

export const getVendorSubCategoryById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid subcategory ID" });
    }

    const subCategory = await prisma.vendorSubCategory.findFirst({
      where: { id },
      include: { category: true },
    });

    if (!subCategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    return res.json({ success: true, subCategory });
  } catch (error) {
    console.error("Get vendor subcategory error:", error);
    return res.status(500).json({ success: false, message: "Failed to get subcategory" });
  }
};

// ==================== CREATE (PROTECTED) ====================

export const createVendorSubCategory = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;
    const { categoryId, subCategoryName, status } = req.body;

    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!categoryId || !subCategoryName || !subCategoryName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category and subcategory name are required",
      });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const subCategory = await prisma.vendorSubCategory.create({
      data: {
        vendorId,
        categoryId: Number(categoryId),
        subCategoryName: subCategoryName.trim(),
        status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        image,
      },
    });

    return res.json({
      success: true,
      message: "Subcategory created successfully",
      subCategory,
    });
  } catch (error) {
    console.error("Create vendor subcategory error:", error);
    return res.status(500).json({ success: false, message: "Failed to create subcategory" });
  }
};

// ==================== UPDATE (PROTECTED) ====================

export const updateVendorSubCategory = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;
    const id = Number(req.params.id);
    const { categoryId, subCategoryName, status } = req.body;

    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid subcategory ID" });
    }

    const existing = await prisma.vendorSubCategory.findFirst({
      where: { id, vendorId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updated = await prisma.vendorSubCategory.update({
      where: { id },
      data: {
        ...(categoryId && { categoryId: Number(categoryId) }),
        ...(subCategoryName && { subCategoryName: subCategoryName.trim() }),
        ...(status && { status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE" }),
        ...(image && { image }),
      },
    });

    return res.json({
      success: true,
      message: "Subcategory updated successfully",
      subCategory: updated,
    });
  } catch (error) {
    console.error("Update vendor subcategory error:", error);
    return res.status(500).json({ success: false, message: "Failed to update subcategory" });
  }
};

// ==================== DELETE (PROTECTED) ====================

export const deleteVendorSubCategory = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;
    const id = Number(req.params.id);

    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const existing = await prisma.vendorSubCategory.findFirst({
      where: { id, vendorId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    await prisma.vendorSubCategory.delete({ where: { id } });

    return res.json({ success: true, message: "Subcategory deleted successfully" });
  } catch (error) {
    console.error("Delete vendor subcategory error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete subcategory" });
  }
};