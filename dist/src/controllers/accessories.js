import prisma from "../lib/prisma.js";
export const createAccessory = async (req, res) => {
    try {
        const user = req.user;
        const role = user?.role?.toUpperCase();
        const name = user?.employeeName || user?.name;
        const accessory = await prisma.accessory.create({
            data: {
                type: req.body.type,
                itemName: req.body.itemName,
                codeNo: req.body.codeNo,
                shortName: req.body.shortName,
                hsnCode: req.body.hsnCode,
                unit: req.body.unit,
                taxSlab: req.body.taxSlab,
                group: req.body.group,
                purchasePrice: req.body.purchasePrice
                    ? Number(req.body.purchasePrice)
                    : null,
                salesPrice: req.body.salesPrice ? Number(req.body.salesPrice) : null,
                mrp: req.body.mrp ? Number(req.body.mrp) : null,
                opStock: req.body.opStock ? Number(req.body.opStock) : 0,
                barCode: req.body.barCode,
                showroomVariants: req.body.showroomVariants || [],
                status: req.body.status || "ACTIVE",
                createdById: Number(user.id),
                createdBy: name,
                createdType: role,
            },
        });
        return res.status(201).json({
            success: true,
            data: accessory,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create item",
        });
    }
};
export const getAccessories = async (req, res) => {
    try {
        const accessories = await prisma.accessory.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeName: true,
                    },
                },
            },
        });
        const data = await Promise.all(accessories.map(async (item) => {
            // Showroom Variants
            const variantIds = Array.isArray(item.showroomVariants)
                ? item.showroomVariants
                    .map((v) => Number(v.id))
                    .filter((id) => !isNaN(id))
                : [];
            const variants = await prisma.showroomVariant.findMany({
                where: {
                    id: {
                        in: variantIds,
                    },
                },
                include: {
                    model: true,
                },
            });
            // Total verified inward purchase qty
            const inward = await prisma.accessoriesPurchaseItem.aggregate({
                _sum: {
                    stock: true,
                },
                where: {
                    accessoryId: item.id,
                    status: "Inward",
                    purchase: {
                        verifyStatus: "verify",
                    },
                },
            });
            const availableStock = Number(inward._sum.stock || 0);
            const currentStock = Number(item.opStock || 0) + availableStock;
            return {
                ...item,
                currentStock,
                showroomVariantDetails: variants,
                createdBy: item.employee?.employeeName || item.createdBy,
            };
        }));
        return res.json({
            success: true,
            data,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch accessories",
        });
    }
};
export const getAccessoriesHistory = async (req, res) => {
    try {
        const accessoryId = Number(req.params.id);
        const accessory = await prisma.accessory.findUnique({
            where: {
                id: accessoryId,
            },
        });
        if (!accessory) {
            return res.status(404).json({
                success: false,
                message: "Accessory not found",
            });
        }
        let balance = Number(accessory.opStock || 0);
        const history = [];
        // Opening Stock
        history.push({
            date: accessory.createdAt,
            type: "Opening Stock",
            reference: "Opening",
            qtyIn: balance,
            qtyOut: 0,
            balance,
            createdBy: accessory.createdBy,
            createdType: accessory.createdType,
        });
        // Purchase History
        const purchases = await prisma.accessoriesPurchaseItem.findMany({
            where: {
                accessoryId,
                status: "Inward",
                purchase: {
                    verifyStatus: "verify",
                },
            },
            include: {
                purchase: {
                    include: {
                        account: true,
                    },
                },
            },
            orderBy: {
                purchase: {
                    purchaseDate: "asc",
                },
            },
        });
        for (const purchase of purchases) {
            balance += Number(purchase.qty);
            history.push({
                date: purchase.purchase.purchaseDate,
                type: "Purchase",
                partyName: purchase.purchase.account?.accountName || "-",
                reference: purchase.purchase.billNo ?? purchase.purchase.purchaseBillNo ?? "-",
                qtyIn: Number(purchase.qty),
                qtyOut: 0,
                billAmount: Number(purchase.netAmount || 0),
                balance,
                createdBy: purchase.purchase.createdBy,
            });
        }
        const invoices = await prisma.order.findMany({
            where: {
                accessoriesAllotStatus: "Completed",
                invoiceNo: {
                    not: null,
                },
                orderAccessories: {
                    some: {
                        accessoryId,
                        status: "Completed",
                    },
                },
            },
            include: {
                lead: {
                    include: {
                        customer: true,
                    },
                },
                orderAccessories: {
                    where: {
                        accessoryId,
                        status: "Completed",
                    },
                },
            },
            orderBy: {
                invoiceDate: "asc",
            },
        });
        for (const invoice of invoices) {
            const qty = invoice.orderAccessories.reduce((sum, item) => sum + Number(item.qty), 0);
            // const amount = invoice.orderAccessories.reduce(
            //   (sum, item) =>
            //     sum + Number(item.salesPrice || 0) * Number(item.qty),
            //   0
            // );
            balance -= qty;
            history.push({
                date: invoice.invoiceDate || invoice.createdAt,
                type: "Accessories Invoice",
                partyName: invoice.lead?.customer?.accountName || "-",
                reference: invoice.invoiceNo || "-",
                qtyIn: 0,
                qtyOut: qty,
                // billAmount: amount || "-",
                balance,
                createdBy: invoice.createdBy,
            });
        }
        return res.json({
            success: true,
            itemName: accessory.itemName,
            codeNo: accessory.codeNo,
            group: accessory.group,
            history,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch accessory history",
        });
    }
};
export const updateAccessory = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const item = await prisma.accessory.update({
            where: { id },
            data: {
                type: req.body.type,
                itemName: req.body.itemName,
                codeNo: req.body.codeNo,
                shortName: req.body.shortName,
                hsnCode: req.body.hsnCode,
                unit: req.body.unit,
                taxSlab: req.body.taxSlab,
                group: req.body.group,
                purchasePrice: req.body.purchasePrice
                    ? Number(req.body.purchasePrice)
                    : null,
                salesPrice: req.body.salesPrice ? Number(req.body.salesPrice) : null,
                mrp: req.body.mrp ? Number(req.body.mrp) : null,
                opStock: req.body.opStock ? Number(req.body.opStock) : 0,
                barCode: req.body.barCode,
                showroomVariants: req.body.showroomVariants || [],
                status: req.body.status,
            },
        });
        return res.json({
            success: true,
            data: item,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update item",
        });
    }
};
export const deleteAccessory = async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.accessory.delete({
            where: { id },
        });
        return res.json({
            success: true,
            message: "Deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete item",
        });
    }
};
//# sourceMappingURL=accessories.js.map