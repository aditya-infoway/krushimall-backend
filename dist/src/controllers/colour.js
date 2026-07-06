import prisma from "../lib/prisma.js";
export const createColour = async (req, res) => {
    try {
        const colour = await prisma.colour.create({
            data: {
                modelId: Number(req.body.modelId),
                variantId: req.body.variantId
                    ? Number(req.body.variantId)
                    : null,
                showroomVariantId: req.body.showroomVariantId
                    ? Number(req.body.showroomVariantId)
                    : null,
                colourName: req.body.colourName,
                colourCode: req.body.colourCode,
                status: req.body.status || "ACTIVE",
            },
        });
        return res.status(201).json({
            success: true,
            data: colour,
            message: "Colour created successfully",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create colour",
        });
    }
};
export const getColours = async (req, res) => {
    try {
        const colours = await prisma.colour.findMany({
            include: {
                model: true,
                variant: true,
                showroomVariant: true,
            },
            orderBy: {
                id: "desc",
            },
        });
        return res.status(200).json({
            success: true,
            data: colours,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch colours",
        });
    }
};
export const getColourById = async (req, res) => {
    try {
        const colour = await prisma.colour.findUnique({
            where: {
                id: Number(req.params.id),
            },
            include: {
                model: true,
                variant: true,
                showroomVariant: true,
            },
        });
        return res.status(200).json({
            success: true,
            data: colour,
        });
    }
    catch (error) {
        console.log(error);
    }
};
export const updateColour = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const updateData = {};
        if (req.body.modelId)
            updateData.modelId = Number(req.body.modelId);
        if (req.body.variantId)
            updateData.variantId = Number(req.body.variantId);
        if (req.body.showroomVariantId !== undefined)
            updateData.showroomVariantId =
                req.body.showroomVariantId
                    ? Number(req.body.showroomVariantId)
                    : null;
        if (req.body.colourName !== undefined)
            updateData.colourName = req.body.colourName;
        if (req.body.colourCode !== undefined)
            updateData.colourCode = req.body.colourCode;
        if (req.body.status !== undefined)
            updateData.status = req.body.status;
        const colour = await prisma.colour.update({
            where: { id },
            data: updateData,
        });
        return res.status(200).json({
            success: true,
            data: colour,
            message: "Colour updated successfully",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update colour",
        });
    }
};
export const deleteColour = async (req, res) => {
    try {
        await prisma.colour.delete({
            where: {
                id: Number(req.params.id),
            },
        });
        return res.status(200).json({
            success: true,
            message: "Colour deleted successfully",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete colour",
        });
    }
};
export const toggleColourStatus = async (req, res) => {
    try {
        const id = Number(req.params.id);
        // Find existing colour
        const colour = await prisma.colour.findUnique({
            where: { id },
        });
        if (!colour) {
            return res.status(404).json({
                success: false,
                message: "Colour not found",
            });
        }
        // Toggle status
        const updatedColour = await prisma.colour.update({
            where: { id },
            data: {
                status: colour.status === "ACTIVE"
                    ? "INACTIVE"
                    : "ACTIVE",
            },
        });
        return res.status(200).json({
            success: true,
            data: updatedColour,
            message: "Status updated successfully",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update status",
        });
    }
};
export const updateColourCode = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { colourCode } = req.body;
        const colour = await prisma.colour.update({
            where: { id },
            data: {
                colourCode,
            },
        });
        return res.status(200).json({
            success: true,
            data: colour,
            message: "Colour updated successfully",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update colour",
        });
    }
};
//# sourceMappingURL=colour.js.map