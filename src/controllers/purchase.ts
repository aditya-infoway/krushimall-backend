import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { generateBillNo } from "../utils/generatepurchaseBillNo.js";

export const createPurchase = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      accountId,
      purchaseDate,
      purchaseBillNo,
      terms,
      narration,
      freightCharge,
      insurance,
      otherCharge,
      roundAmount,
      totalQty,
      totalAmount,
      grandTotal,
      items,
    } = req.body;

    const billNo = await generateBillNo(
      "PURCHASE",
      "purchase"
    );

    const purchase = await prisma.purchase.create({
      data: {
        billNo,
        accountId: Number(accountId),
        purchaseDate: purchaseDate
          ? new Date(purchaseDate)
          : null,
        purchaseBillNo,
        terms,
        narration,

        freightCharge: Number(freightCharge || 0),
        insurance: Number(insurance || 0),
        otherCharge: Number(otherCharge || 0),
        roundAmount: Number(roundAmount || 0),

        totalQty: Number(totalQty || 0),
        totalAmount: Number(totalAmount || 0),
        grandTotal: Number(grandTotal || 0),

        items: {
          create:
            items?.map((item: any) => ({
              itemName: item.item,
              itemCode: item.itemCode,
              color: item.color,
              chassisNo: item.chassisNo,
              engineNo: item.engineNo,
              qty: Number(item.qty),
              ratePer: Number(item.ratePer),
              gstPercent: Number(item.gstPercent),
              amount: Number(item.amount),
            })) || [],
        },
      },
      include: {
        account: true,
        items: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: purchase,
      message: "Purchase created successfully",
    });
} catch (error: any) {
  console.error(error);

  if (error.code === "P2002") {
    const originalMessage =
      error.meta?.driverAdapterError?.cause?.originalMessage || "";

    if (originalMessage.includes("PurchaseItem_chassisNo_key")) {
      return res.status(400).json({
        success: false,
        message: "Chassis No already exists",
      });
    }

    if (originalMessage.includes("PurchaseItem_engineNo_key")) {
      return res.status(400).json({
        success: false,
        message: "Engine No already exists",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Duplicate value already exists",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Failed to create purchase",
  });
}
};
export const getPurchases = async (
  req: Request,
  res: Response
) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        account: true,
        items: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: purchases,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchases",
    });
  }
};
export const getPurchaseById = async (
  req: Request,
  res: Response
) => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        account: true,
        items: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    console.error(error);
  }
};
export const deletePurchase = async (
  req: Request,
  res: Response
) => {
  try {
    await prisma.purchase.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Purchase deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete purchase",
    });
  }
};
export const getPurchaseBillNo = async (
  req: Request,
  res: Response
) => {
  try {
    const billNo = await generateBillNo(
      "PURCHASE",
      "purchase"
    );

    return res.status(200).json({
      success: true,
      billNo,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate bill no",
    });
  }
};