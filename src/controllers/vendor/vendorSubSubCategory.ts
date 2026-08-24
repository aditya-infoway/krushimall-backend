import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { VendorAuthedRequest } from "../../middleware/verifyVendorAdminToken.js";

// ==================== LIST — ADMIN (apni sub-subcategories, sab status) ====================

export const getVendorSubSubCategories = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const subSubCategories = await prisma.vendorSubSubCategory.findMany({
      where: { vendorId },
      include: { subCategory: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: subSubCategories });
  } catch (error) {
    console.error("Get vendor sub-subcategories error:", error);
    return res.status(500).json({ success: false, message: "Failed to get sub-subcategories" });
  }
};

// ==================== LIST — STOREFRONT (public, sab vendors, sirf active) ====================

export const getPublicVendorSubSubCategories = async (req: Request, res: Response) => {
  try {
    const subSubCategories = await prisma.vendorSubSubCategory.findMany({
      where: { status: "ACTIVE" },
      include: { subCategory: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: subSubCategories });
  } catch (error) {
    console.error("Get public sub-subcategories error:", error);
    return res.status(500).json({ success: false, message: "Failed to get sub-subcategories" });
  }
};

// ==================== GET SINGLE (PUBLIC) ====================

export const getVendorSubSubCategoryById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const subSubCategory = await prisma.vendorSubSubCategory.findFirst({
      where: { id },
      include: { subCategory: { include: { category: true } } },
    });

    if (!subSubCategory) {
      return res.status(404).json({ success: false, message: "Sub-subcategory not found" });
    }

    return res.json({ success: true, subSubCategory });
  } catch (error) {
    console.error("Get vendor sub-subcategory error:", error);
    return res.status(500).json({ success: false, message: "Failed to get sub-subcategory" });
  }
};

// ==================== CREATE (PROTECTED) ====================

export const createVendorSubSubCategory = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;
    const { subCategoryId, subSubCategoryName, status } = req.body;

    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!subCategoryId || !subSubCategoryName || !subSubCategoryName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subcategory and sub-subcategory name are required",
      });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const subSubCategory = await prisma.vendorSubSubCategory.create({
      data: {
        vendorId,
        subCategoryId: Number(subCategoryId),
        subSubCategoryName: subSubCategoryName.trim(),
        status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        image,
      },
    });

    return res.json({
      success: true,
      message: "Sub-subcategory created successfully",
      subSubCategory,
    });
  } catch (error) {
    console.error("Create vendor sub-subcategory error:", error);
    return res.status(500).json({ success: false, message: "Failed to create sub-subcategory" });
  }
};

// ==================== UPDATE (PROTECTED) ====================

export const updateVendorSubSubCategory = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;
    const id = Number(req.params.id);
    const { subCategoryId, subSubCategoryName, status } = req.body;

    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await prisma.vendorSubSubCategory.findFirst({
      where: { id, vendorId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Sub-subcategory not found" });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updated = await prisma.vendorSubSubCategory.update({
      where: { id },
      data: {
        ...(subCategoryId && { subCategoryId: Number(subCategoryId) }),
        ...(subSubCategoryName && { subSubCategoryName: subSubCategoryName.trim() }),
        ...(status && { status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE" }),
        ...(image && { image }),
      },
    });

    return res.json({
      success: true,
      message: "Sub-subcategory updated successfully",
      subSubCategory: updated,
    });
  } catch (error) {
    console.error("Update vendor sub-subcategory error:", error);
    return res.status(500).json({ success: false, message: "Failed to update sub-subcategory" });
  }
};

// ==================== DELETE (PROTECTED) ====================

export const deleteVendorSubSubCategory = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;
    const id = Number(req.params.id);

    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const existing = await prisma.vendorSubSubCategory.findFirst({
      where: { id, vendorId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Sub-subcategory not found" });
    }

    await prisma.vendorSubSubCategory.delete({ where: { id } });

    return res.json({ success: true, message: "Sub-subcategory deleted successfully" });
  } catch (error) {
    console.error("Delete vendor sub-subcategory error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete sub-subcategory" });
  }
};