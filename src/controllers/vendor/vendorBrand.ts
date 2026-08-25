// src/controllers/vendor/vendorBrand.ts

import {Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { VendorAuthedRequest } from "../../middleware/verifyVendorAdminToken.js";

// ==================== CREATE VENDOR BRAND ====================

export const createVendorBrand = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;
    const { brandName, status } = req.body;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!brandName || !brandName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Brand name is required",
      });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const brand = await prisma.vendorBrand.create({
      data: {
        vendorId,
        brandName: brandName.trim(),
        status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        image,
      },
    });

    return res.json({
      success: true,
      message: "Brand created successfully",
      brand,
    });
  } catch (error) {
    console.error("Create vendor brand error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create brand",
    });
  }
};

// ==================== LIST VENDOR BRANDS ====================

export const getVendorBrands = async (
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

    const brands = await prisma.vendorBrand.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: brands });
  } catch (error) {
    console.error("Get vendor brands error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get brands",
    });
  }
};
// ==================== LIST — STOREFRONT/PANEL (public, sab vendors, sirf active) ====================


// ==================== GET SINGLE VENDOR BRAND ====================

export const getVendorBrandById = async (
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
        message: "Invalid brand ID",
      });
    }

    const brand = await prisma.vendorBrand.findFirst({
      where: { id, vendorId },
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    return res.json({ success: true, brand });
  } catch (error) {
    console.error("Get vendor brand error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get brand",
    });
  }
};
export const getPublicVendorBrands = async (
  req: Request,
  res: Response,
) => {
  try {
    const brands = await prisma.vendorBrand.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: brands });
  } catch (error) {
    console.error("Get public vendor brands error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get brands",
    });
  }
};
// ==================== UPDATE VENDOR BRAND ====================

export const updateVendorBrand = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;
    const id = Number(req.params.id);
    const { brandName, status } = req.body;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid brand ID",
      });
    }

    const existing = await prisma.vendorBrand.findFirst({
      where: { id, vendorId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updated = await prisma.vendorBrand.update({
      where: { id },
      data: {
        ...(brandName && { brandName: brandName.trim() }),
        ...(status && {
          status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        }),
        ...(image && { image }),
      },
    });

    return res.json({
      success: true,
      message: "Brand updated successfully",
      brand: updated,
    });
  } catch (error) {
    console.error("Update vendor brand error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update brand",
    });
  }
};

// ==================== DELETE VENDOR BRAND ====================

export const deleteVendorBrand = async (
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

    const existing = await prisma.vendorBrand.findFirst({
      where: { id, vendorId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    await prisma.vendorBrand.delete({ where: { id } });

    return res.json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    console.error("Delete vendor brand error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete brand",
    });
  }
};