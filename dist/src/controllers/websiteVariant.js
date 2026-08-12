import prisma from "../lib/prisma.js";
export const createWebsiteVariant = async (req, res) => {
    try {
        const user = req.user;
        const role = user?.role?.toUpperCase();
        const createData = {
            ...req.body,
            currentStep: 1,
            status: "DRAFT",
            createdType: role,
            createdBy: user?.employeeName || user?.name,
            createdById: user?.id,
        };
        const files = req.files;
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
    }
    catch (error) {
        console.error("Create Website Variant Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create Website Variant",
        });
    }
};
export const getWebsiteVariants = async (req, res) => {
    try {
        const { status, isUpcoming } = req.query;
        const where = {};
        if (status) {
            where.status = status;
        }
        // Only filter if the query parameter is provided
        if (isUpcoming !== undefined) {
            where.isUpcoming = isUpcoming === "true";
        }
        const variants = await prisma.websiteVariant.findMany({
            where,
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
export const getWebsiteVariantById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const current = await prisma.websiteVariant.findUnique({
            where: {
                id,
            },
            include: {
                brand: true,
                category: true,
                model: true,
                variant: true,
                modelYear: true,
            },
        });
        if (!current) {
            return res.status(404).json({
                success: false,
                message: "Website Variant not found",
            });
        }
        // ===========================
        // Similar Products
        // Same Brand + Same Category
        // ===========================
        const similarProducts = await prisma.websiteVariant.findMany({
            where: {
                id: {
                    not: current.id,
                },
                status: "ACTIVE",
                categoryId: current.categoryId,
                brandId: current.brandId,
            },
            include: {
                brand: true,
                model: true,
            },
            take: 4,
        });
        // Fill remaining from same category if less than 4
        if (similarProducts.length < 4) {
            const extraProducts = await prisma.websiteVariant.findMany({
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
                    brand: true,
                    model: true,
                },
                take: 4 - similarProducts.length,
            });
            similarProducts.push(...extraProducts);
        }
        // ===========================
        // Related Products
        // Same Category
        // ===========================
        const relatedProducts = await prisma.websiteVariant.findMany({
            where: {
                id: {
                    not: current.id,
                },
                status: "ACTIVE",
                categoryId: current.categoryId,
            },
            include: {
                brand: true,
                model: true,
            },
            orderBy: {
                createdAt: "desc",
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch Website Variant",
        });
    }
};
export const updateWebsiteVariant = async (req, res) => {
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
        const updateData = {
            ...req.body,
        };
        // Uploaded Files
        const files = req.files;
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
    }
    catch (error) {
        console.error("Update Website Variant Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update Website Variant",
        });
    }
};
export const saveStep = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const updateData = {
            ...req.body,
        };
        const files = req.files;
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to save step",
        });
    }
};
export const submitWebsiteVariant = async (req, res) => {
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit Website Variant",
        });
    }
};
export const deleteWebsiteVariant = async (req, res) => {
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete Website Variant",
        });
    }
};
export const toggleWebsiteVariantStatus = async (req, res) => {
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
        const newStatus = existing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        const updated = await prisma.websiteVariant.update({
            where: { id },
            data: {
                status: newStatus,
            },
        });
        return res.status(200).json({
            success: true,
            message: `Status changed to ${newStatus}`,
            data: updated,
        });
    }
    catch (error) {
        console.error("Toggle Status Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update status",
        });
    }
};
export const getLatestWebsiteVariants = async (req, res) => {
    try {
        const variants = await prisma.websiteVariant.findMany({
            where: {
                status: "ACTIVE",
                isUpcoming: false,
                AND: [
                    { frontView: { not: null } },
                    { frontView: { not: "" } },
                    { productName: { not: null } },
                    { productName: { not: "" } },
                ],
            },
            select: {
                id: true,
                productName: true,
                frontView: true,
                exShowroomPrice: true,
                horsePower: true,
                fuelType: true,
                createdAt: true,
                state: true,
                city: true,
                brand: { select: { brandName: true } },
                model: { select: { modelName: true } },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 8,
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
            message: "Failed to fetch latest tractors",
        });
    }
};
export const getPopularWebsiteVariants = async (req, res) => {
    try {
        const variants = await prisma.websiteVariant.findMany({
            where: {
                status: "ACTIVE",
                isUpcoming: false,
                AND: [
                    { frontView: { not: null } },
                    { frontView: { not: "" } },
                    { productName: { not: null } },
                    { productName: { not: "" } },
                ],
            },
            select: {
                id: true,
                productName: true,
                frontView: true,
                exShowroomPrice: true,
                horsePower: true,
                fuelType: true,
                createdAt: true,
                state: true,
                city: true,
                enquiryCount: true,
                brand: {
                    select: {
                        brandName: true,
                    },
                },
                model: {
                    select: {
                        modelName: true,
                    },
                },
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
        return res.status(200).json({
            success: true,
            data: variants,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch popular tractors",
        });
    }
};
export const getUpcomingWebsiteVariants = async (req, res) => {
    try {
        const variants = await prisma.websiteVariant.findMany({
            where: {
                status: "ACTIVE",
                isUpcoming: true,
                AND: [
                    { frontView: { not: null } },
                    { frontView: { not: "" } },
                    { productName: { not: null } },
                    { productName: { not: "" } },
                ],
            },
            select: {
                id: true,
                productName: true,
                frontView: true,
                exShowroomPrice: true,
                horsePower: true,
                fuelType: true,
                state: true,
                city: true,
                brand: {
                    select: {
                        brandName: true,
                    },
                },
                model: {
                    select: {
                        modelName: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 8,
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
            message: "Failed to fetch upcoming tractors",
        });
    }
};
//# sourceMappingURL=websiteVariant.js.map