import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createSparePart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const role = user?.role?.toUpperCase();
    const name = user?.employeeName || user?.name;

    // FK sirf Employee table ko point karta hai,
    // isliye admin/branch ki id yahan nahi daalni
    const isEmployee = role === "EMPLOYEE";

    const sparePart = await prisma.sparePart.create({
      data: {
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

        createdById: isEmployee ? Number(user.id) : null,
        createdBy: name,
        createdType: role,
      },
    });

    return res.status(201).json({
      success: true,
      data: sparePart,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create spare part",
    });
  }
};

export const getSpareParts = async (req: Request, res: Response) => {
  try {
    const spareParts = await prisma.sparePart.findMany({
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

    // ==========================================
    // STOCK IN: verified + inward purchases
    // ==========================================
    const inwardTotals = await prisma.sparePartsPurchaseItem.groupBy({
      by: ["sparePartId"],
      _sum: {
        qty: true,
      },
      where: {
        status: "Inward",
        purchase: {
          verifyStatus: "verify",
        },
      },
    });

    const inwardMap = new Map<number, number>();
    for (const row of inwardTotals) {
      if (row.sparePartId) {
        inwardMap.set(Number(row.sparePartId), Number(row._sum.qty || 0));
      }
    }

    // ==========================================
    // Showroom variants + final current stock
    // ==========================================
    const data = await Promise.all(
      spareParts.map(async (item) => {
        const variantIds = Array.isArray(item.showroomVariants)
          ? item.showroomVariants
              .map((v: any) => Number(v.id))
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

        const openingStock = Number(item.opStock || 0);
        const purchasedQty = inwardMap.get(item.id) || 0;

        // Opening + Purchase  (order allotment later add karenge)
        const currentStock = openingStock + purchasedQty;

        return {
          ...item,
          currentStock,
          showroomVariantDetails: variants,
          createdBy: item.employee?.employeeName || item.createdBy,
        };
      }),
    );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch spare parts",
    });
  }
};

export const getSparePartHistory = async (req: Request, res: Response) => {
  try {
    const sparePartId = Number(req.params.id);

    const sparePart = await prisma.sparePart.findUnique({
      where: {
        id: sparePartId,
      },
    });

    if (!sparePart) {
      return res.status(404).json({
        success: false,
        message: "Spare part not found",
      });
    }

    let balance = Number(sparePart.opStock || 0);

    const history: any[] = [];

    // Opening Stock
    history.push({
      date: sparePart.createdAt,
      type: "Opening Stock",
      reference: "Opening",
      qtyIn: balance,
      qtyOut: 0,
      balance,
      createdBy: sparePart.createdBy,
      createdType: sparePart.createdType,
    });

    // Purchase History
    const purchases = await prisma.sparePartsPurchaseItem.findMany({
      where: {
        sparePartId,
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
        reference:
          purchase.purchase.billNo ?? purchase.purchase.purchaseBillNo ?? "-",
        qtyIn: Number(purchase.qty),
        qtyOut: 0,
        billAmount: Number(purchase.netAmount || 0),
        balance,
        createdBy: purchase.purchase.createdBy,
      });
    }

    return res.json({
      success: true,
      itemName: sparePart.itemName,
      codeNo: sparePart.codeNo,
      group: sparePart.group,
      history,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch spare part history",
    });
  }
};

export const updateSparePart = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;

    const data: any = {};
    const num = (v: any) => (v === "" || v === null ? null : Number(v));

    if (b.itemName !== undefined) data.itemName = b.itemName;
    if (b.codeNo !== undefined) data.codeNo = b.codeNo;
    if (b.shortName !== undefined) data.shortName = b.shortName;
    if (b.hsnCode !== undefined) data.hsnCode = b.hsnCode;
    if (b.unit !== undefined) data.unit = b.unit;
    if (b.taxSlab !== undefined) data.taxSlab = b.taxSlab;
    if (b.group !== undefined) data.group = b.group;
    if (b.purchasePrice !== undefined) data.purchasePrice = num(b.purchasePrice);
    if (b.salesPrice !== undefined) data.salesPrice = num(b.salesPrice);
    if (b.mrp !== undefined) data.mrp = num(b.mrp);
    if (b.opStock !== undefined) data.opStock = Number(b.opStock) || 0;
    if (b.barCode !== undefined) data.barCode = b.barCode;
    if (b.showroomVariants !== undefined) data.showroomVariants = b.showroomVariants;
    if (b.status !== undefined) data.status = b.status;

    const item = await prisma.sparePart.update({ where: { id }, data });

    return res.json({ success: true, data: item });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update spare part",
    });
  }
};

export const deleteSparePart = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    await prisma.sparePart.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete spare part",
    });
  }
};

export const getActiveSpareParts = async (req: Request, res: Response) => {
  try {
    const spareParts = await prisma.sparePart.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: spareParts });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch active spare parts" });
  }
};