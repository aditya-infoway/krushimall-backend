// src/controllers/vendor/vendorCategory.ts

import {Request, Response } from "express";
import prisma from "../../lib/prisma.js";
// src/controllers/vendor/vendorCategory.ts
import { VendorAuthedRequest } from "../../middleware/verifyVendorAdminToken.js";

// ==================== CREATE VENDOR CATEGORY ====================

export const createVendorCategory = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;
    const { categoryName, status } = req.body;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!categoryName || !categoryName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const category = await prisma.vendorCategory.create({
      data: {
        vendorId,
        categoryName: categoryName.trim(),
        status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        image,
      },
    });

    return res.json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create vendor category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};

// ==================== LIST VENDOR CATEGORIES ====================

// ==================== LIST — ADMIN (apni categories, sab status) ====================

export const getVendorCategories = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const categories = await prisma.vendorCategory.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Get vendor categories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get categories",
    });
  }
};

// ==================== LIST — STOREFRONT (public, sab vendors, sirf active) ====================

export const getPublicVendorCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.vendorCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Get public categories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get categories",
    });
  }
};

// ==================== GET SINGLE VENDOR CATEGORY ====================

export const getVendorCategoryById = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;
    const id = Number(req.params.id);

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await prisma.vendorCategory.findFirst({
      where: { id, vendorId },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.json({ success: true, category });
  } catch (error) {
    console.error("Get vendor category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get category",
    });
  }
};

// ==================== UPDATE VENDOR CATEGORY ====================

export const updateVendorCategory = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;
    const id = Number(req.params.id);
    const { categoryName, status } = req.body;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const existing = await prisma.vendorCategory.findFirst({
      where: { id, vendorId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updated = await prisma.vendorCategory.update({
      where: { id },
      data: {
        ...(categoryName && { categoryName: categoryName.trim() }),
        ...(status && {
          status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        }),
        ...(image && { image }),
      },
    });

    return res.json({
      success: true,
      message: "Category updated successfully",
      category: updated,
    });
  } catch (error) {
    console.error("Update vendor category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};

// ==================== DELETE VENDOR CATEGORY ====================

export const deleteVendorCategory = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;
    const id = Number(req.params.id);

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const existing = await prisma.vendorCategory.findFirst({
      where: { id, vendorId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await prisma.vendorCategory.delete({ where: { id } });

    return res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete vendor category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
};