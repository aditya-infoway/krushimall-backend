import prisma from "../lib/prisma.js";
// ==================================================
// CREATE SHOWROOM VARIANT
// ==================================================
export const createShowroomVariant = async (req, res) => {
    try {
        const { modelId, variantId, purPrice, purTaxPercent, exShowroomPrice, exShowroomTaxPercent, insurance, insuranceTaxPercent, rtoCharge, rtoTaxType, rtoTaxPercent, salesPrice, status, accessories = [], } = req.body;
        const selectedModelId = Number(modelId);
        const selectedVariantId = Number(variantId);
        if (!selectedModelId ||
            !selectedVariantId) {
            return res.status(400).json({
                success: false,
                message: "Model and variant are required",
            });
        }
        // Check variant belongs to selected model
        const selectedVariant = await prisma.variant.findFirst({
            where: {
                id: selectedVariantId,
                modelId: selectedModelId,
            },
        });
        if (!selectedVariant) {
            return res.status(400).json({
                success: false,
                message: "Selected variant does not belong to selected model",
            });
        }
        // Check duplicate
        const existing = await prisma.showroomVariant.findFirst({
            where: {
                modelId: selectedModelId,
                variantId: selectedVariantId,
            },
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Showroom variant already exists for this model",
            });
        }
        const showroomVariant = await prisma.showroomVariant.create({
            data: {
                modelId: selectedModelId,
                variantId: selectedVariantId,
                // Variant name comes from Variant master
                variantName: selectedVariant.variantName,
                purPrice: Number(purPrice),
                purTaxPercent: Number(purTaxPercent),
                exShowroomPrice: Number(exShowroomPrice),
                exShowroomTaxPercent: Number(exShowroomTaxPercent),
                insurance: Number(insurance),
                insuranceTaxPercent: Number(insuranceTaxPercent),
                rtoCharge: Number(rtoCharge),
                rtoTaxType,
                rtoTaxPercent: Number(rtoTaxPercent),
                salesPrice: Number(salesPrice),
                status: status || "ACTIVE",
                accessories: {
                    create: accessories.map((a) => ({
                        accessoryId: Number(a.accessoryId),
                        qty: Number(a.qty || 1),
                        price: Number(a.price),
                        taxPercent: Number(a.taxPercent),
                        totalPrice: Number(a.totalPrice),
                    })),
                },
            },
            include: {
                model: true,
                variant: true,
                accessories: {
                    include: {
                        accessory: true,
                    },
                },
            },
        });
        return res.status(201).json({
            success: true,
            data: showroomVariant,
            message: "Showroom Variant created successfully",
        });
    }
    catch (error) {
        console.error("CREATE SHOWROOM VARIANT ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create showroom variant",
        });
    }
};
// ==================================================
// GET ALL SHOWROOM VARIANTS
// ==================================================
export const getShowroomVariants = async (req, res) => {
    try {
        const variants = await prisma.showroomVariant.findMany({
            include: {
                model: true,
                variant: true,
                accessories: {
                    include: {
                        accessory: true,
                    },
                },
            },
            orderBy: {
                id: "desc",
            },
        });
        const formatted = variants.map((item) => ({
            ...item,
            model: item.model.modelName,
            variantName: item.variant
                ?.variantName ||
                item.variantName,
        }));
        return res.status(200).json({
            success: true,
            data: formatted,
        });
    }
    catch (error) {
        console.error("GET SHOWROOM VARIANTS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch showroom variants",
        });
    }
};
// ==================================================
// GET SHOWROOM VARIANT BY ID
// ==================================================
export const getShowroomVariantById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const showroomVariant = await prisma.showroomVariant.findUnique({
            where: {
                id,
            },
            include: {
                model: true,
                variant: true,
                accessories: {
                    include: {
                        accessory: true,
                    },
                },
            },
        });
        if (!showroomVariant) {
            return res.status(404).json({
                success: false,
                message: "Showroom variant not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: showroomVariant,
        });
    }
    catch (error) {
        console.error("GET SHOWROOM VARIANT ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch showroom variant",
        });
    }
};
// ==================================================
// UPDATE SHOWROOM VARIANT
// ==================================================
export const updateShowroomVariant = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { modelId, variantId, purPrice, purTaxPercent, exShowroomPrice, exShowroomTaxPercent, insurance, insuranceTaxPercent, rtoCharge, rtoTaxType, rtoTaxPercent, salesPrice, status, accessories = [], } = req.body;
        const selectedModelId = Number(modelId);
        const selectedVariantId = Number(variantId);
        if (!selectedModelId ||
            !selectedVariantId) {
            return res.status(400).json({
                success: false,
                message: "Model and variant are required",
            });
        }
        // Check selected variant belongs to model
        const selectedVariant = await prisma.variant.findFirst({
            where: {
                id: selectedVariantId,
                modelId: selectedModelId,
            },
        });
        if (!selectedVariant) {
            return res.status(400).json({
                success: false,
                message: "Selected variant does not belong to selected model",
            });
        }
        // Check duplicate except current record
        const existing = await prisma.showroomVariant.findFirst({
            where: {
                id: {
                    not: id,
                },
                modelId: selectedModelId,
                variantId: selectedVariantId,
            },
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Showroom variant already exists for this model",
            });
        }
        const showroomVariant = await prisma.$transaction(async (tx) => {
            await tx.showroomVariantAccessory.deleteMany({
                where: {
                    showroomVariantId: id,
                },
            });
            return tx.showroomVariant.update({
                where: {
                    id,
                },
                data: {
                    modelId: selectedModelId,
                    variantId: selectedVariantId,
                    variantName: selectedVariant.variantName,
                    purPrice: Number(purPrice),
                    purTaxPercent: Number(purTaxPercent),
                    exShowroomPrice: Number(exShowroomPrice),
                    exShowroomTaxPercent: Number(exShowroomTaxPercent),
                    insurance: Number(insurance),
                    insuranceTaxPercent: Number(insuranceTaxPercent),
                    rtoCharge: Number(rtoCharge),
                    rtoTaxType,
                    rtoTaxPercent: Number(rtoTaxPercent),
                    salesPrice: Number(salesPrice),
                    status: status || "ACTIVE",
                    accessories: {
                        create: accessories.map((a) => ({
                            accessoryId: Number(a.accessoryId),
                            qty: Number(a.qty ||
                                1),
                            price: Number(a.price),
                            taxPercent: Number(a.taxPercent),
                            totalPrice: Number(a.totalPrice),
                        })),
                    },
                },
                include: {
                    model: true,
                    variant: true,
                    accessories: {
                        include: {
                            accessory: true,
                        },
                    },
                },
            });
        });
        return res.status(200).json({
            success: true,
            data: showroomVariant,
            message: "Showroom Variant updated successfully",
        });
    }
    catch (error) {
        console.error("UPDATE SHOWROOM VARIANT ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update showroom variant",
        });
    }
};
// ==================================================
// DELETE SHOWROOM VARIANT
// ==================================================
export const deleteShowroomVariant = async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.showroomVariant.delete({
            where: {
                id,
            },
        });
        return res.status(200).json({
            success: true,
            message: "Showroom Variant deleted successfully",
        });
    }
    catch (error) {
        console.error("DELETE SHOWROOM VARIANT ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete showroom variant",
        });
    }
};
//# sourceMappingURL=showroomVariant.js.map