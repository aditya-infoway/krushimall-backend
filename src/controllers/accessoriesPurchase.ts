import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { generateAccessoriesPurchaseBillNo } from "../utils/accessoriesPurchase.js";

export const createAccessoriesPurchase = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      accountId,
      purchaseDate,
      purchaseBillNo,
      purchaseLocation,
      dueDate,
      terms,
      narration,

      cashAccountId,
      bankAccountId,

      paymentMode,
      chequeNo,
      chequeDate,
      clearDate,
      bankNarration,

      freightCharge,
      insurance,
      otherCharge,
      roundAmount,

      taxableValue,
      totalQty,
      totalAmount,

      cgst,
      sgst,
      igst,

      grandTotal,
      verifyStatus,
      items,
    } = req.body;

    const billNo = await generateAccessoriesPurchaseBillNo();

    const purchase = await prisma.accessoriesPurchase.create({
      data: {
        billNo,

        accountId: Number(accountId),

        purchaseBillNo,

        purchaseDate: new Date(purchaseDate),

        dueDate: dueDate ? new Date(dueDate) : null,

        purchaseLocation,
        narration,

        terms,

        cashAccountId: cashAccountId ? Number(cashAccountId) : null,

        bankAccountId: bankAccountId ? Number(bankAccountId) : null,

        paymentMode,
        chequeNo,

        chequeDate: chequeDate ? new Date(chequeDate) : null,

        clearDate: clearDate ? new Date(clearDate) : null,

        bankNarration,

        freightCharge: Number(freightCharge || 0),

        insurance: Number(insurance || 0),

        otherCharge: Number(otherCharge || 0),

        roundAmount: Number(roundAmount || 0),

        taxableValue: Number(taxableValue || 0),

        totalQty: Number(totalQty || 0),

        totalAmount: Number(totalAmount || 0),

        cgst: Number(cgst || 0),

        sgst: Number(sgst || 0),

        igst: Number(igst || 0),

        grandTotal: Number(grandTotal || 0),

        verifyStatus: verifyStatus || "not_verify",

        items: {
          create:
            items?.map((item: any) => ({
              accessoryId: item.accessoryId ? Number(item.accessoryId) : null,

              itemName: item.item,

              itemCode: item.itemCode,

              shortName: item.shortName || null,

              hsnCode: item.hsn || null,

              unit: item.unit || null,
              taxSlab: item.gstPercent != null ? String(item.gstPercent) : null,
                groupName: item.groupName || null,
              modelName: item.modelName || null,

              variantName: item.variantName || null,

              qty: Number(item.qty),

              stock: Number(item.stock || item.qty),

              purchaseRate: Number(item.pPrice),

              gstPercent: Number(item.gstPercent),

              gstAmount: Number(item.gstAmount || 0),

              netAmount: Number(item.netAmount),
                status: "Pending",
            })) || [],
        },
      },
      include: {
        account: true,
        items: true,
      },
    });
    if (terms?.toLowerCase() === "credit" && accountId) {
      const account = await prisma.account.findUnique({
        where: {
          id: Number(accountId),
        },
      });

      if (account) {
        const currentBalance = Number(account.closingBalance || 0);

        const purchaseAmount = Number(grandTotal || 0);

        let closingBalance = currentBalance;
        let balanceType = account.drCr;

        if (balanceType === "Cr") {
          closingBalance += purchaseAmount;
        } else {
          if (currentBalance >= purchaseAmount) {
            closingBalance -= purchaseAmount;
          } else {
            closingBalance = purchaseAmount - currentBalance;

            balanceType = "Cr";
          }
        }

        await prisma.account.update({
          where: {
            id: Number(accountId),
          },
          data: {
            closingBalance,
            drCr: balanceType,
          },
        });
      }
    }
    return res.status(201).json({
      success: true,
      data: purchase,
      message: "Accessories Purchase created successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Accessories Purchase",
    });
  }
};
export const getAccessoriesPurchases = async (
  req: Request,
  res: Response
) => {
  try {
    const purchases =
      await prisma.accessoriesPurchase.findMany({
        include: {
          account: true,
          items: true,
        },
        orderBy: {
          id: "desc",
        },
      });

    const data = purchases.map((purchase) => ({
      ...purchase,

      allItemsInward:
        purchase.items.length > 0 &&
        purchase.items.every(
          (item) => item.status === "Inward"
        ),
    }));

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
    });
  }
};
export const updateAccessoriesPurchase = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const purchase = await prisma.accessoriesPurchase.findUnique({
      where: { id },
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Accessories Purchase not found",
      });
    }

    const {
      accountId,
      purchaseDate,
      purchaseBillNo,
      purchaseLocation,
      dueDate,
      terms,
      narration,

      cashAccountId,
      bankAccountId,

      paymentMode,
      chequeNo,
      chequeDate,
      clearDate,
      bankNarration,

      freightCharge,
      insurance,
      otherCharge,
      roundAmount,

      taxableValue,
      totalQty,
      totalAmount,

      cgst,
      sgst,
      igst,

      grandTotal,
      verifyStatus,
      items,
    } = req.body;

    // Delete old items
    await prisma.accessoriesPurchaseItem.deleteMany({
      where: {
         purchaseId: id,
      },
    });

    const updatedPurchase =
      await prisma.accessoriesPurchase.update({
        where: { id },
        data: {
          accountId: Number(accountId),

         purchaseDate: new Date(purchaseDate),

          purchaseBillNo,
          purchaseLocation,

          dueDate: dueDate
            ? new Date(dueDate)
            : null,

          terms,
          narration,

          cashAccountId: cashAccountId
            ? Number(cashAccountId)
            : null,

          bankAccountId: bankAccountId
            ? Number(bankAccountId)
            : null,

          paymentMode,
          chequeNo,

          chequeDate: chequeDate
            ? new Date(chequeDate)
            : null,

          clearDate: clearDate
            ? new Date(clearDate)
            : null,

          bankNarration,

          freightCharge: Number(freightCharge || 0),
          insurance: Number(insurance || 0),
          otherCharge: Number(otherCharge || 0),
          roundAmount: Number(roundAmount || 0),

          taxableValue: Number(taxableValue || 0),

          totalQty: Number(totalQty || 0),
          totalAmount: Number(totalAmount || 0),

          cgst: Number(cgst || 0),
          sgst: Number(sgst || 0),
          igst: Number(igst || 0),

          grandTotal: Number(grandTotal || 0),

          verifyStatus,

          items: {
            create: items.map((item: any) => ({
              accessoryId: item.accessoryId
                ? Number(item.accessoryId)
                : null,

              itemName: item.item,

              itemCode: item.itemCode,

              shortName: item.shortName || null,

              hsnCode: item.hsn || null,

              unit: item.unit || null,
  groupName: item.groupName || null,    
              taxSlab:
                item.gstPercent != null
                  ? String(item.gstPercent)
                  : null,

              modelName: item.modelName || null,

              variantName: item.variantName || null,

              qty: Number(item.qty),

              stock: Number(item.stock || item.qty),

              purchaseRate: Number(item.pPrice),

              gstPercent: Number(item.gstPercent),

              gstAmount: Number(item.gstAmount || 0),

              netAmount: Number(item.netAmount),
               status: item.status || "Pending",
            })),
          },
        },
        include: {
          account: true,
          items: true,
        },
      });

    return res.json({
      success: true,
      data: updatedPurchase,
      message: "Accessories Purchase updated successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update Accessories Purchase",
    });
  }
};
export const getAccessoriesPurchaseById = async (
  req: Request,
  res: Response,
) => {
  try {
    const purchase = await prisma.accessoriesPurchase.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        account: true,
        items: true,
      },
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    return res.json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
    });
  }
};
export const verifyAccessoriesPurchase = async (
  req: Request,
  res: Response,
) => {
  try {
    await prisma.accessoriesPurchase.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        verifyStatus: "verify",
      },
    });

    return res.json({
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
    });
  }
};
export const deleteAccessoriesPurchase = async (
  req: Request,
  res: Response,
) => {
  try {
    await prisma.accessoriesPurchase.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    return res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
    });
  }
};
export const getAccessoriesPurchaseBillNo = async (
  req: Request,
  res: Response,
) => {
  try {
    const billNo = await generateAccessoriesPurchaseBillNo();

    return res.json({
      success: true,
      billNo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate bill no",
    });
  }
};
export const updateAccessoriesPurchaseItemStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const item = await prisma.accessoriesPurchaseItem.update({
      where: {
        id: Number(id),
      },
      data: {
        status,
      },
    });

    return res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update item status",
    });
  }
};