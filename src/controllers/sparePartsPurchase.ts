import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { generateSparePartsPurchaseBillNo } from "../utils/sparePartsPurchase.js";
import { generateCashPaymentVoucher } from "../utils/generateCashPaymentVoucher.js";
import { generateBankPaymentVoucher } from "../utils/generateBankPaymentVoucher.js";

// Roles jinki id Employee table mein NAHI hoti
const NON_EMPLOYEE_ROLES = ["ADMIN", "SUPERADMIN", "BRANCH"];

const getCreatorInfo = (user: any) => {
  const role = user?.role?.toUpperCase().replace(/\s+/g, "_");
  const name = user?.employeeName || user?.name || "Admin";
  const isEmployee = !!role && !NON_EMPLOYEE_ROLES.includes(role);

  return {
    role,
    name,
    createdById: isEmployee && user?.id ? Number(user.id) : null,
  };
};

export const createSparePartsPurchase = async (req: Request, res: Response) => {
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
      // transport (optional)
      transportName,
      transportNo,
      lrNo,
      transportDate,
      transportCharge,
    } = req.body;

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
        where: { id: Number(cashAccountId) },
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
            { minimumFractionDigits: 2, maximumFractionDigits: 2 },
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
        where: { id: Number(bankAccountId) },
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
            { minimumFractionDigits: 2, maximumFractionDigits: 2 },
          )}, Purchase amount: ₹${purchaseAmount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
        });
      }
    }

    const billNo = await generateSparePartsPurchaseBillNo(
      Number(companyId),
      Number(financialYearId),
    );

    const user = (req as any).user;
    const { role, name, createdById } = getCreatorInfo(user);

    const purchase = await prisma.sparePartsPurchase.create({
      data: {
        companyId: Number(companyId),
        financialYearId: Number(financialYearId),
        billNo,
        accountId: Number(accountId),
        createdById,
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

        // transport
        transportName: transportName || null,
        transportNo: transportNo || null,
        lrNo: lrNo || null,
        transportDate: transportDate ? new Date(transportDate) : null,
        transportCharge: Number(transportCharge || 0),

        items: {
          create:
            items?.map((item: any) => ({
              sparePartId: item.sparePartId ? Number(item.sparePartId) : null,
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

    // CREDIT
    if (terms?.toLowerCase() === "credit" && accountId) {
      const supplier = await prisma.account.findUnique({
        where: { id: Number(accountId) },
      });

      if (supplier) {
        const currentBalance = Number(supplier.closingBalance || 0);
        let closingBalance = currentBalance;
        let balanceType = supplier.drCr;

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
          where: { id: Number(accountId) },
          data: { closingBalance, drCr: balanceType },
        });
      }
    }

    // CASH
    else if (terms?.toLowerCase() === "cash" && cashAccountId) {
      const cashAccount = await prisma.account.findUnique({
        where: { id: Number(cashAccountId) },
      });

      if (cashAccount) {
        const currentBalance = Number(cashAccount.closingBalance || 0);
        await prisma.account.update({
          where: { id: Number(cashAccountId) },
          data: {
            closingBalance: currentBalance - purchaseAmount,
            drCr: "Dr",
          },
        });
      }
    }

    // BANK
    else if (terms?.toLowerCase() === "bank" && bankAccountId) {
      const bankAccount = await prisma.account.findUnique({
        where: { id: Number(bankAccountId) },
      });

      if (bankAccount) {
        const currentBalance = Number(bankAccount.closingBalance || 0);
        await prisma.account.update({
          where: { id: Number(bankAccountId) },
          data: {
            closingBalance: currentBalance - purchaseAmount,
            drCr: "Dr",
          },
        });
      }
    }

    // CREATE CASH PAYMENT
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
          type: "SPCP",
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

    // CREATE BANK PAYMENT
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
          type: "SPBP",
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
      message: "Spare Parts Purchase created successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create Spare Parts Purchase",
    });
  }
};

export const getSparePartsPurchases = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = user?.role?.toUpperCase().replace(/\s+/g, "_");
    const isAdmin = NON_EMPLOYEE_ROLES.includes(role);

    const whereCondition = isAdmin ? {} : { createdById: Number(user.id) };

    const purchases = await prisma.sparePartsPurchase.findMany({
      where: whereCondition,
      include: {
        account: true,
        items: true,
      },
      orderBy: { id: "desc" },
    });

    const data = purchases.map((purchase) => ({
      ...purchase,
      allItemsInward:
        purchase.items.length > 0 &&
        purchase.items.every((item) => item.status === "Inward"),
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false });
  }
};

export const getSparePartPurchaseHistory = async (
  req: Request,
  res: Response,
) => {
  try {
    const sparePartId = Number(req.params.sparePartId);

    if (!Number.isInteger(sparePartId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid spare part ID",
      });
    }

    const items = await prisma.sparePartsPurchaseItem.findMany({
      where: {
        sparePartId,
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
      orderBy: { inwardDate: "desc" },
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

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("GET SPARE PART PURCHASE HISTORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch spare part purchase history",
      error: error?.message,
    });
  }
};

export const updateSparePartsPurchase = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const purchase = await prisma.sparePartsPurchase.findUnique({
      where: { id },
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Spare Parts Purchase not found",
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
      transportName,
      transportNo,
      lrNo,
      transportDate,
      transportCharge,
    } = req.body;

    // Delete old items
    await prisma.sparePartsPurchaseItem.deleteMany({
      where: { purchaseId: id },
    });

    const updatedPurchase = await prisma.sparePartsPurchase.update({
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
        transportName: transportName || null,
        transportNo: transportNo || null,
        lrNo: lrNo || null,
        transportDate: transportDate ? new Date(transportDate) : null,
        transportCharge: Number(transportCharge || 0),
        items: {
          create: items.map((item: any) => ({
            sparePartId: item.sparePartId ? Number(item.sparePartId) : null,
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
      message: "Spare Parts Purchase updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update Spare Parts Purchase",
    });
  }
};

export const getSparePartsPurchaseById = async (
  req: Request,
  res: Response,
) => {
  try {
    const purchase = await prisma.sparePartsPurchase.findUnique({
      where: { id: Number(req.params.id) },
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

    return res.json({ success: true, data: purchase });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
};

export const verifySparePartsPurchase = async (req: Request, res: Response) => {
  try {
    await prisma.sparePartsPurchase.update({
      where: { id: Number(req.params.id) },
      data: { verifyStatus: "verify" },
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
};

export const deleteSparePartsPurchase = async (req: Request, res: Response) => {
  try {
    await prisma.sparePartsPurchase.delete({
      where: { id: Number(req.params.id) },
    });

    return res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
};

export const getSparePartsPurchaseBillNo = async (
  req: Request,
  res: Response,
) => {
  try {
    const { companyId, financialYearId } = req.query;

    const billNo = await generateSparePartsPurchaseBillNo(
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

export const updateSparePartsPurchaseItemStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = (req as any).user;
    const { role, name, createdById: inwardById } = getCreatorInfo(user);

    const updateData: any = { status };

    if (status === "Inward") {
      updateData.inwardById = inwardById;
      updateData.inwardBy = name;
      updateData.inwardType = role;
      updateData.inwardDate = new Date();
    }

    const item = await prisma.sparePartsPurchaseItem.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return res.json({ success: true, data: item });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update item status",
    });
  }
};

export const getSparePartsInventory = async (req: Request, res: Response) => {
  try {
    // 1) Saare spare parts - purchase ho ya na ho, inventory me dikhne chahiye
    const spareParts = await prisma.sparePart.findMany({
      orderBy: { createdAt: "desc" },
    });

    type InventoryRow = {
      id: number;
      sparePartId: number | null;
      itemName: string;
      itemCode: string;
      hsn: string;
      group: string;
      tax: number;
      purPrice: number;
      salesPrice: number;
      mrp: number;
      closingStock: number;
    };

    const inventoryMap = new Map<string, InventoryRow>();

    for (const sp of spareParts) {
      inventoryMap.set(`sparePart-${sp.id}`, {
        id: sp.id,
        sparePartId: sp.id,
        itemName: sp.itemName || "-",
        itemCode: sp.codeNo || "-",
        hsn: sp.hsnCode || "-",
        group: sp.group || "-",
        tax: parseFloat(String(sp.taxSlab ?? "0")) || 0,
        purPrice: Number(sp.purchasePrice || 0),
        salesPrice: Number(sp.salesPrice || 0),
        mrp: Number(sp.mrp || 0),
        closingStock: Number(sp.opStock || 0), // opening stock se start
      });
    }

    // 2) Verified + Inward purchases ka qty upar se add karo
    const purchases = await prisma.sparePartsPurchase.findMany({
      where: { verifyStatus: "verify" },
      include: {
        items: {
          where: { status: "Inward" },
        },
      },
      orderBy: { id: "desc" }, // latest purchase pehle
    });

    const priceUpdated = new Set<string>();

    for (const purchase of purchases) {
      for (const item of purchase.items) {
        const key = item.sparePartId
          ? `sparePart-${item.sparePartId}`
          : `code-${item.itemCode}`;

        const purchasedQty = Number(item.qty || 0);
        const existing = inventoryMap.get(key);

        if (existing) {
          existing.closingStock += purchasedQty;

          // latest purchase rate (purchases desc order me hain)
          if (!priceUpdated.has(key)) {
            existing.purPrice = Number(item.purchaseRate || 0);
            priceUpdated.add(key);
          }
        } else {
          // sparePartId null wale items (master me link nahi)
          inventoryMap.set(key, {
            id: item.id,
            sparePartId: null,
            itemName: item.itemName || "-",
            itemCode: item.itemCode || "-",
            hsn: item.hsnCode || "-",
            group: item.groupName || "-",
            tax: Number(item.gstPercent || item.taxSlab || 0),
            purPrice: Number(item.purchaseRate || 0),
            salesPrice: 0,
            mrp: 0,
            closingStock: purchasedQty,
          });
          priceUpdated.add(key);
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: Array.from(inventoryMap.values()),
    });
  } catch (error) {
    console.error("GET SPARE PARTS INVENTORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch spare parts inventory",
    });
  }
};
