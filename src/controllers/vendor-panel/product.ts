// src/controllers/vendor/vendorProduct.ts

import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { VendorAuthedRequest } from "../../middleware/verifyVendorToken.js";

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
      partNumber,
      oemNumber,
      countryOfOrigin,
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

        partNumber: partNumber || null,

        oemNumber: oemNumber || null,

        countryOfOrigin: countryOfOrigin || null,

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
// ==================== PUBLIC: LIST PRODUCTS (Storefront) ====================

export const getPublicProducts = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      categoryId,
      subCategoryId,
      subSubCategoryId,
      brandId,
      search,
      minPrice,
      maxPrice,
      inStock,
      page = "1",
      limit = "50",
    } = req.query;

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
  verificationStatus: "APPROVED", // 👈 apne enum ki exact value confirm kar lena
};

    if (categoryId) {
      where.categoryId = Number(categoryId);
    }

    if (subCategoryId) {
      where.subCategoryId = Number(subCategoryId);
    }

    if (subSubCategoryId) {
      where.subSubCategoryId = Number(subSubCategoryId);
    }

    if (brandId) {
      where.brandId = Number(brandId);
    }

    if (search && typeof search === "string" && search.trim()) {
      where.OR = [
        { productName: { contains: search.trim(), mode: "insensitive" } },
        { sku: { contains: search.trim(), mode: "insensitive" } },
        { keywords: { contains: search.trim(), mode: "insensitive" } },
        { partNumber: { contains: search.trim(), mode: "insensitive" } },
        { oemNumber: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    if (minPrice || maxPrice) {
      where.sellingPrice = {
        ...(minPrice ? { gte: Number(minPrice) } : {}),
        ...(maxPrice ? { lte: Number(maxPrice) } : {}),
      };
    }

    if (inStock === "true") {
      where.stock = "IN_STOCK";
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          subCategory: true,
          subSubCategory: true,
          brand: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get public products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get products",
    });
  }
};

// ==================== PUBLIC: GET SINGLE PRODUCT (Storefront) ====================
// ==================== PUBLIC: RELATED PRODUCTS ====================

export const getRelatedProducts = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);
    const limit = Math.min(Number(req.query.limit) || 6, 20);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Pehle current product ki categoryId nikaalo
    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { categoryId: true },
    });

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: currentProduct.categoryId,
        verificationStatus: "APPROVED",
        id: { not: id },   // ✅ backend hi current product exclude karega
      },
      include: {
        category: true,
        brand: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return res.json({
      success: true,
      data: relatedProducts,
    });
  } catch (error) {
    console.error("Get related products error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get related products",
    });
  }
};
export const getPublicProductById = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await prisma.product.findFirst({
      where: {
    id,
    verificationStatus: "APPROVED", // 👈 same yahan bhi
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
    console.error("Get public product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get product",
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
      partNumber,
      oemNumber,
      countryOfOrigin,
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
      existingAdditionalImages,
      productCondition,
      manufacturingDate,
      expiryDate,
      returnPolicy,
      estimatedDeliveryTime,
      freeShipping,
      warrantyPeriod,
      warrantyDetails,
      specifications,
        verificationStatus,
    } = req.body;

    // ==================== FILES (newly uploaded on edit) ====================

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const mainImageFile = files?.mainImage?.[0];
    const thumbnailImageFile = files?.thumbnailImage?.[0];
    const additionalImageFiles = files?.additionalImages || [];

    // new main image uploaded? use it. otherwise fall back to the
    // string value that came in req.body (existing url, or "" if removed)
    const resolvedMainImage = mainImageFile
      ? `/uploads/${mainImageFile.filename}`
      : mainImage;

    const resolvedThumbnailImage = thumbnailImageFile
      ? `/uploads/${thumbnailImageFile.filename}`
      : thumbnailImage;

    // additional images = images that were kept (existingAdditionalImages,
    // sent as a JSON string array from the frontend) + any newly uploaded ones
    let parsedExistingAdditionalImages: string[] = [];
    try {
      parsedExistingAdditionalImages = existingAdditionalImages
        ? JSON.parse(existingAdditionalImages)
        : [];
    } catch {
      parsedExistingAdditionalImages = [];
    }

    const newAdditionalImagePaths = additionalImageFiles.map(
      (file) => `/uploads/${file.filename}`,
    );

    const resolvedAdditionalImages = [
      ...parsedExistingAdditionalImages,
      ...newAdditionalImagePaths,
    ];

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

          ...(partNumber !== undefined && {
            partNumber: partNumber || null,
          }),

          ...(oemNumber !== undefined && {
            oemNumber: oemNumber || null,
          }),

          ...(countryOfOrigin !== undefined && {
            countryOfOrigin: countryOfOrigin || null,
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

          ...(resolvedMainImage !== undefined && {
            mainImage: resolvedMainImage || null,
          }),

          ...(resolvedThumbnailImage !== undefined && {
            thumbnailImage: resolvedThumbnailImage || null,
          }),

          // additional images: always recompute when either new files were
          // uploaded or the frontend sent an existingAdditionalImages list
          ...((additionalImageFiles.length > 0 ||
            existingAdditionalImages !== undefined) && {
            additionalImages: resolvedAdditionalImages,
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
          ...(verificationStatus !== undefined && {
  verificationStatus,
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