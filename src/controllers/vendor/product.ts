// src/controllers/vendor/vendorProduct.ts

import { Response } from "express";
import prisma from "../../lib/prisma.js";
import { VendorAuthedRequest } from "../../middleware/verifyVendorAdminToken.js";

// ==================== CREATE VENDOR PRODUCT ====================

export const createProduct = async (
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

    const {
      productName,
      sku,
      categoryId,
      subCategoryId,
      subSubCategoryId,
      brandId,
      productType,
      stock,
      keywords,
      shortDescription,
      keyFeatures,
      videoUrl,
      mrp,
      sellingPrice,
      tax,
      finalPrice,
      stockQuantity,
      barcode,
      unit,
      weight,
      maxOrderQuantity,
      productCondition,
      manufacturingDate,
      expiryDate,
      returnPolicy,
      estimatedDeliveryTime,
      freeShipping,
      warrantyPeriod,
      warrantyDetails,
      specifications,
    } = req.body;

    // ==================== VALIDATION ====================

    if (!productName || !productName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    // ==================== FILES ====================

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const mainImageFile = files?.mainImage?.[0];
    const thumbnailImageFile = files?.thumbnailImage?.[0];
    const additionalImageFiles = files?.additionalImages || [];

    const mainImage = mainImageFile
      ? `/uploads/${mainImageFile.filename}`
      : null;

    const thumbnailImage = thumbnailImageFile
      ? `/uploads/${thumbnailImageFile.filename}`
      : null;

    const additionalImages = additionalImageFiles.map(
      (file) => `/uploads/${file.filename}`,
    );

    // ==================== PARSE JSON ====================

    let parsedKeyFeatures: string[] = [];

    try {
      parsedKeyFeatures = keyFeatures
        ? JSON.parse(keyFeatures)
        : [];
    } catch {
      parsedKeyFeatures = [];
    }

    let parsedSpecifications: any[] = [];

    try {
      parsedSpecifications = specifications
        ? JSON.parse(specifications)
        : [];
    } catch {
      parsedSpecifications = [];
    }

    // ==================== CREATE PRODUCT ====================

    const product = await prisma.product.create({
      data: {
        vendorId,

        productName: productName.trim(),

        sku: sku || null,

        categoryId: Number(categoryId),

        subCategoryId: subCategoryId
          ? Number(subCategoryId)
          : null,

        subSubCategoryId: subSubCategoryId
          ? Number(subSubCategoryId)
          : null,

        brandId: brandId
          ? Number(brandId)
          : null,

        productType: productType || "SIMPLE",

        stock: stock || "IN_STOCK",

        keywords: keywords || null,

        shortDescription: shortDescription || null,

        keyFeatures: parsedKeyFeatures,

        videoUrl: videoUrl || null,

        mrp: mrp
          ? Number(mrp)
          : 0,

        sellingPrice: sellingPrice
          ? Number(sellingPrice)
          : 0,

        tax: tax
          ? Number(tax)
          : 0,

        finalPrice: finalPrice
          ? Number(finalPrice)
          : 0,

        stockQuantity: stockQuantity
          ? Number(stockQuantity)
          : 0,

        barcode: barcode || null,

        unit: unit || null,

        weight: weight || null,

        maxOrderQuantity: maxOrderQuantity
          ? Number(maxOrderQuantity)
          : 1,

        // ==================== IMAGES ====================

        mainImage,

        thumbnailImage,

        additionalImages,

        // ==================== ADDITIONAL ====================

        productCondition:
          productCondition || "NEW",

        manufacturingDate:
          manufacturingDate
            ? new Date(manufacturingDate)
            : null,

        expiryDate:
          expiryDate
            ? new Date(expiryDate)
            : null,

        returnPolicy:
          returnPolicy || "NONE",

        estimatedDeliveryTime:
          estimatedDeliveryTime || null,

        freeShipping:
          freeShipping === true ||
          freeShipping === "true",

        warrantyPeriod:
          warrantyPeriod || null,

        warrantyDetails:
          warrantyDetails || null,

        specifications:
          parsedSpecifications,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};
// ==================== LIST VENDOR PRODUCTS ====================

export const getProducts = async (
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

    const products = await prisma.product.findMany({
      where: {
        vendorId,
      },
      include: {
        category: true,
        subCategory: true,
        subSubCategory: true,
        brand: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error(
      "Get vendor products error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get products",
    });
  }
};

// ==================== GET SINGLE VENDOR PRODUCT ====================

export const getProductById = async (
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
        message: "Invalid product ID",
      });
    }

    const product =
      await prisma.product.findFirst({
        where: {
          id,
          vendorId,
        },
        include: {
          category: true,
          subCategory: true,
          subSubCategory: true,
          brand: true,
        },
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "Get vendor product error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get product",
    });
  }
};

// ==================== UPDATE VENDOR PRODUCT ====================

export const updateProduct = async (
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
        message: "Invalid product ID",
      });
    }

    const existing =
      await prisma.product.findFirst({
        where: {
          id,
          vendorId,
        },
      });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const {
      productName,
      sku,
      categoryId,
      subCategoryId,
      subSubCategoryId,
      brandId,
      productType,
      stock,
      keywords,
      shortDescription,
      keyFeatures,
      videoUrl,
      mrp,
      sellingPrice,
      tax,
      finalPrice,
      stockQuantity,
      barcode,
      unit,
      weight,
      maxOrderQuantity,
      mainImage,
      thumbnailImage,
      additionalImages,
      productCondition,
      manufacturingDate,
      expiryDate,
      returnPolicy,
      estimatedDeliveryTime,
      freeShipping,
      warrantyPeriod,
      warrantyDetails,
      specifications,
    } = req.body;

    const updated =
      await prisma.product.update({
        where: {
          id,
        },

        data: {
          ...(productName !== undefined && {
            productName: productName.trim(),
          }),

          ...(sku !== undefined && {
            sku: sku || null,
          }),

          ...(categoryId !== undefined && {
            categoryId: Number(categoryId),
          }),

          ...(subCategoryId !== undefined && {
            subCategoryId: subCategoryId
              ? Number(subCategoryId)
              : null,
          }),

          ...(subSubCategoryId !== undefined && {
            subSubCategoryId: subSubCategoryId
              ? Number(subSubCategoryId)
              : null,
          }),

          ...(brandId !== undefined && {
            brandId: brandId
              ? Number(brandId)
              : null,
          }),

          ...(productType !== undefined && {
            productType,
          }),

          ...(stock !== undefined && {
            stock,
          }),

          ...(keywords !== undefined && {
            keywords: keywords || null,
          }),

          ...(shortDescription !== undefined && {
            shortDescription:
              shortDescription || null,
          }),

          ...(keyFeatures !== undefined && {
            keyFeatures,
          }),

          ...(videoUrl !== undefined && {
            videoUrl: videoUrl || null,
          }),

          ...(mrp !== undefined && {
            mrp: Number(mrp),
          }),

          ...(sellingPrice !== undefined && {
            sellingPrice: Number(sellingPrice),
          }),

          ...(tax !== undefined && {
            tax: Number(tax),
          }),

          ...(finalPrice !== undefined && {
            finalPrice: Number(finalPrice),
          }),

          ...(stockQuantity !== undefined && {
            stockQuantity: Number(stockQuantity),
          }),

          ...(barcode !== undefined && {
            barcode: barcode || null,
          }),

          ...(unit !== undefined && {
            unit: unit || null,
          }),

          ...(weight !== undefined && {
            weight: weight || null,
          }),

          ...(maxOrderQuantity !== undefined && {
            maxOrderQuantity:
              Number(maxOrderQuantity),
          }),

          // ==================== IMAGES ====================

          ...(mainImage !== undefined && {
            mainImage: mainImage || null,
          }),

          ...(thumbnailImage !== undefined && {
            thumbnailImage:
              thumbnailImage || null,
          }),

          ...(additionalImages !== undefined && {
            additionalImages: Array.isArray(
              additionalImages,
            )
              ? additionalImages
              : [],
          }),

          // ==================== DETAILS ====================

          ...(productCondition !== undefined && {
            productCondition,
          }),

          ...(manufacturingDate !== undefined && {
            manufacturingDate:
              manufacturingDate
                ? new Date(manufacturingDate)
                : null,
          }),

          ...(expiryDate !== undefined && {
            expiryDate: expiryDate
              ? new Date(expiryDate)
              : null,
          }),

          ...(returnPolicy !== undefined && {
            returnPolicy:
              returnPolicy || null,
          }),

          ...(estimatedDeliveryTime !== undefined && {
            estimatedDeliveryTime:
              estimatedDeliveryTime || null,
          }),

          ...(freeShipping !== undefined && {
            freeShipping:
              freeShipping === true ||
              freeShipping === "true",
          }),

          ...(warrantyPeriod !== undefined && {
            warrantyPeriod:
              warrantyPeriod || null,
          }),

          ...(warrantyDetails !== undefined && {
            warrantyDetails:
              warrantyDetails || null,
          }),

          ...(specifications !== undefined && {
            specifications,
          }),
        },
      });

    return res.json({
      success: true,
      message: "Product updated successfully",
      product: updated,
    });
  } catch (error) {
    console.error(
      "Update vendor product error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};

// ==================== DELETE VENDOR PRODUCT ====================

export const deleteProduct = async (
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
        message: "Invalid product ID",
      });
    }

    const existing =
      await prisma.product.findFirst({
        where: {
          id,
          vendorId,
        },
      });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await prisma.product.delete({
      where: {
        id,
      },
    });

    return res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete vendor product error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};