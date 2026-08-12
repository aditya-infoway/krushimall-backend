import prisma from "../../lib/prisma.js";
import * as WebsiteVariantController from "../websiteVariant.js";
// Create
export const createWebsiteVariant = async (req, res) => {
    try {
        const vendorAuth = req.vendor;
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
        req.body.vendorId = vendor.id;
        req.body.createdById = vendorAuth.userId;
        req.body.createdBy = vendor.name; // or vendor.vendorName
        req.body.createdType = "VENDOR";
        return WebsiteVariantController.createWebsiteVariant(req, res);
    }
    catch (error) {
        console.error("Vendor Create Website Variant:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create Website Variant",
        });
    }
};
// List
export const getWebsiteVariants = async (req, res) => {
    try {
        const vendorAuth = req.vendor;
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch Website Variants",
        });
    }
};
// Get By Id
export const getWebsiteVariantById = async (req, res) => {
    try {
        const vendorAuth = req.vendor;
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch Website Variant",
        });
    }
};
// Update
export const updateWebsiteVariant = async (req, res) => {
    try {
        const vendorAuth = req.vendor;
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update Website Variant",
        });
    }
};
// Save Step
export const saveStep = async (req, res) => {
    try {
        const vendorAuth = req.vendor;
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to save step",
        });
    }
};
// Submit
export const submitWebsiteVariant = async (req, res) => {
    try {
        const vendorAuth = req.vendor;
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit Website Variant",
        });
    }
};
// Delete
export const deleteWebsiteVariant = async (req, res) => {
    try {
        const vendorAuth = req.vendor;
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete Website Variant",
        });
    }
};
//# sourceMappingURL=websiteVariant.js.map