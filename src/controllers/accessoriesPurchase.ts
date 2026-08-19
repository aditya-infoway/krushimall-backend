import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { generateAccessoriesPurchaseBillNo } from "../utils/accessoriesPurchase.js";
import { generateCashPaymentVoucher } from "../utils/generateCashPaymentVoucher.js";
import { generateBankPaymentVoucher } from "../utils/generateBankPaymentVoucher.js";
export const createAccessoriesPurchase = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      companyId,
      financialYearId,
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
    // ======================================================
    // CHECK CASH / BANK BALANCE BEFORE ACCESSORIES PURCHASE
    // ======================================================

    const purchaseAmount = Number(grandTotal || 0);

    if (purchaseAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Purchase amount must be greater than zero",
      });
    }

    // CASH BALANCE CHECK
    if (terms?.toLowerCase() === "cash") {
      if (!cashAccountId) {
        return res.status(400).json({
          success: false,
          message: "Please select a cash account",
        });
      }

      const cashAccount = await prisma.account.findUnique({
        where: {
          id: Number(cashAccountId),
        },
        select: {
          id: true,
          accountName: true,
          closingBalance: true,
          drCr: true,
        },
      });

      if (!cashAccount) {
        return res.status(404).json({
          success: false,
          message: "Selected cash account was not found",
        });
      }

      const availableBalance =
        cashAccount.drCr === "Dr" ? Number(cashAccount.closingBalance || 0) : 0;

      if (availableBalance < purchaseAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance in ${cashAccount.accountName}. Available balance: ₹${availableBalance.toLocaleString(
            "en-IN",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )}, Purchase amount: ₹${purchaseAmount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
        });
      }
    }

    // BANK BALANCE CHECK
    if (terms?.toLowerCase() === "bank") {
      if (!bankAccountId) {
        return res.status(400).json({
          success: false,
          message: "Please select a bank account",
        });
      }

      const bankAccount = await prisma.account.findUnique({
        where: {
          id: Number(bankAccountId),
        },
        select: {
          id: true,
          accountName: true,
          closingBalance: true,
          drCr: true,
        },
      });

      if (!bankAccount) {
        return res.status(404).json({
          success: false,
          message: "Selected bank account was not found",
        });
      }

      const availableBalance =
        bankAccount.drCr === "Dr" ? Number(bankAccount.closingBalance || 0) : 0;

      if (availableBalance < purchaseAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance in ${bankAccount.accountName}. Available balance: ₹${availableBalance.toLocaleString(
            "en-IN",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )}, Purchase amount: ₹${purchaseAmount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
        });
      }
    }
    const billNo = await generateAccessoriesPurchaseBillNo(
      Number(companyId),
      Number(financialYearId),
    );
    const user = (req as any).user;
    const role = user?.role?.toUpperCase().replace(/\s+/g, "_");
    const name = user?.employeeName || user?.name || "Admin";
    const purchase = await prisma.accessoriesPurchase.create({
      data: {
        companyId: Number(companyId),

        financialYearId: Number(financialYearId),
        billNo,

        accountId: Number(accountId),
        createdById: Number(user.id),
        createdBy: name,
        createdType: role,
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
              barCode: item.barCode || null,
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
    // User details

    // ─────────────────────────────────────
    // CREDIT ACCESSORIES PURCHASE
    // ─────────────────────────────────────

    if (terms?.toLowerCase() === "credit" && accountId) {
      const supplier = await prisma.account.findUnique({
        where: {
          id: Number(accountId),
        },
      });

      if (supplier) {
        const currentBalance = Number(supplier.closingBalance || 0);

        let closingBalance = currentBalance;

        let balanceType = supplier.drCr;

        // Supplier balance increases
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

    // ─────────────────────────────────────
    // CASH ACCESSORIES PURCHASE
    // ─────────────────────────────────────
    // ─────────────────────────────────────
    // CASH ACCESSORIES PURCHASE
    // ─────────────────────────────────────
    else if (terms?.toLowerCase() === "cash" && cashAccountId) {
      const cashAccount = await prisma.account.findUnique({
        where: {
          id: Number(cashAccountId),
        },
      });

      if (cashAccount) {
        const currentBalance = Number(cashAccount.closingBalance || 0);

        await prisma.account.update({
          where: {
            id: Number(cashAccountId),
          },
          data: {
            closingBalance: currentBalance - purchaseAmount,

            drCr: "Dr",
          },
        });
      }
    }
    // ─────────────────────────────────────
    // BANK ACCESSORIES PURCHASE
    // ─────────────────────────────────────
    // ─────────────────────────────────────
    // BANK ACCESSORIES PURCHASE
    // ─────────────────────────────────────
    else if (terms?.toLowerCase() === "bank" && bankAccountId) {
      const bankAccount = await prisma.account.findUnique({
        where: {
          id: Number(bankAccountId),
        },
      });

      if (bankAccount) {
        const currentBalance = Number(bankAccount.closingBalance || 0);

        await prisma.account.update({
          where: {
            id: Number(bankAccountId),
          },
          data: {
            closingBalance: currentBalance - purchaseAmount,

            drCr: "Dr",
          },
        });
      }
    }
    // ─────────────────────────────────────
    // CREATE CASH PAYMENT
    // ─────────────────────────────────────

    if (terms?.toLowerCase() === "cash" && cashAccountId) {
      const voucherNo = await generateCashPaymentVoucher(
        Number(companyId),
        Number(financialYearId),
      );

      await prisma.cashPayment.create({
        data: {
          companyId: Number(companyId),

          financialYearId: Number(financialYearId),

          voucherNo,

          type: "APCP",

          date: purchase.purchaseDate ?? new Date(),

          cashAccountId: Number(cashAccountId),

          oppAccountId: Number(accountId),

          amount: purchaseAmount,

          narration: narration || "",

          createdType: role,
          createdBy: name,
        },
      });
    }

    // ─────────────────────────────────────
    // CREATE BANK PAYMENT
    // ─────────────────────────────────────

    if (terms?.toLowerCase() === "bank" && bankAccountId) {
      const voucherNo = await generateBankPaymentVoucher(
        Number(companyId),
        Number(financialYearId),
      );

      await prisma.bankPayment.create({
        data: {
          companyId: Number(companyId),

          financialYearId: Number(financialYearId),

          voucherNo,

          type: "APBP",

          date: purchase.purchaseDate ?? new Date(),

          bankAccountId: Number(bankAccountId),

          oppAccountId: Number(accountId),

          amount: purchaseAmount,

          paymentMode: paymentMode || null,

          chequeNo: chequeNo || null,

          chequeDate: chequeDate ? new Date(chequeDate) : null,

          clearDate: clearDate ? new Date(clearDate) : null,

          narration: bankNarration || narration || "",

          createdType: role,
          createdBy: name,
        },
      });
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
export const getAccessoriesPurchases = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = user?.role?.toUpperCase().replace(/\s+/g, "_");

    // Admin / Superadmin ko sabhi purchases dikhengi
    // Employee (ya branch) ko sirf apni khud ki banayi hui purchases dikhengi
    const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

    const whereCondition = isAdmin
      ? {}
      : {
          createdById: Number(user.id),
        };

    const purchases = await prisma.accessoriesPurchase.findMany({
      where: whereCondition,
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
        purchase.items.every((item) => item.status === "Inward"),
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
// accessoriesPurchase.controller.ts me add karein

export const getAccessoryPurchaseHistory = async (
  req: Request,
  res: Response,
) => {
  try {
    const accessoryId = Number(req.params.accessoryId);

    if (!Number.isInteger(accessoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid accessory ID",
      });
    }

    // Sirf INWARD status wale items chahiye — kyunki wahi actual stock hai
    const items = await prisma.accessoriesPurchaseItem.findMany({
      where: {
        accessoryId: accessoryId,
        status: "Inward",
      },
      include: {
        purchase: {
          select: {
            id: true,
            billNo: true,
            purchaseBillNo: true,
            purchaseDate: true,
            verifyStatus: true,
          },
        },
      },
      orderBy: {
        inwardDate: "desc",
      },
    });

    const data = items.map((item) => ({
      id: item.id,
      purchaseId: item.purchase?.id,
      purchaseBillNo:
        item.purchase?.purchaseBillNo || item.purchase?.billNo || "-",
      billNo: item.purchase?.billNo || "-",
      inwardDate: item.inwardDate,
      stock: item.stock ?? item.qty,
      qty: item.qty,
      status: item.status,
    }));

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("GET ACCESSORY PURCHASE HISTORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch accessory purchase history",
      error: error?.message,
    });
  }
};
export const updateAccessoriesPurchase = async (
  req: Request,
  res: Response,
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

    const updatedPurchase = await prisma.accessoriesPurchase.update({
      where: { id },
      data: {
        accountId: Number(accountId),

        purchaseDate: new Date(purchaseDate),

        purchaseBillNo,
        purchaseLocation,

        dueDate: dueDate ? new Date(dueDate) : null,

        terms,
        narration,

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

        verifyStatus,

        items: {
          create: items.map((item: any) => ({
            accessoryId: item.accessoryId ? Number(item.accessoryId) : null,

            itemName: item.item,

            itemCode: item.itemCode,

            shortName: item.shortName || null,
            barCode: item.barCode || null,
            hsnCode: item.hsn || null,

            unit: item.unit || null,
            groupName: item.groupName || null,
            taxSlab: item.gstPercent != null ? String(item.gstPercent) : null,

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
    const { companyId, financialYearId } = req.query;

    const billNo = await generateAccessoriesPurchaseBillNo(
      Number(companyId),
      Number(financialYearId),
    );

    return res.json({ success: true, billNo });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate bill no",
    });
  }
};
export const updateAccessoriesPurchaseItemStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = (req as any).user;
    const role = user?.role?.toUpperCase().replace(/\s+/g, "_");
    const name = user?.employeeName || user?.name || "Admin";

    const updateData: any = {
      status,
    };

    // Save inward audit only when status becomes Inward
    if (status === "Inward") {
      updateData.inwardById = Number(user.id);
      updateData.inwardBy = name;
      updateData.inwardType = role;
      updateData.inwardDate = new Date();
    }

    const item = await prisma.accessoriesPurchaseItem.update({
      where: {
        id: Number(id),
      },
      data: updateData,
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
export const getAccessoriesInventory = async (req: Request, res: Response) => {
  try {
    // Only verified accessories purchases
    const purchases = await prisma.accessoriesPurchase.findMany({
      where: {
        verifyStatus: "verify",
      },

      include: {
        items: {
          where: {
            status: "Inward",
          },

          include: {
            accessory: true,
          },
        },
      },

      orderBy: {
        id: "desc",
      },
    });

    // Combine the same accessory from multiple purchases
    const inventoryMap = new Map<
      string,
      {
        id: number;
        accessoryId: number | null;
        itemName: string;
        itemCode: string;
        hsn: string;
        group: string;
        tax: number;
        purPrice: number;
        salesPrice: number;
        mrp: number;
        closingStock: number;
      }
    >();

    for (const purchase of purchases) {
      for (const item of purchase.items) {
        // Prefer accessoryId because item code may change
        const key = item.accessoryId
          ? `accessory-${item.accessoryId}`
          : `code-${item.itemCode}`;

        const existingItem = inventoryMap.get(key);

        const purchasedQty = Number(item.qty || 0);

        if (existingItem) {
          existingItem.closingStock += purchasedQty;

          existingItem.purPrice = Number(item.purchaseRate || 0);
        } else {
          const openingStock = Number(item.accessory?.opStock || 0);
          inventoryMap.set(key, {
            id: item.accessoryId ?? item.id,

            accessoryId: item.accessoryId ?? null,

            itemName: item.itemName || "-",

            itemCode: item.itemCode || "-",

            hsn: item.hsnCode || "-",

            group: item.groupName || item.accessory?.group || "-",

            tax: Number(item.gstPercent || item.taxSlab || 0),

            purPrice: Number(item.purchaseRate || 0),

            salesPrice: Number(item.accessory?.salesPrice || 0),

            mrp: Number(item.accessory?.mrp || 0),

            closingStock: openingStock + purchasedQty,
          });
        }
      }
    }

    const inventory = Array.from(inventoryMap.values());

    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error("GET ACCESSORIES INVENTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch accessories inventory",
    });
  }
};
