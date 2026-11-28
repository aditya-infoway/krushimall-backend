// src/controllers/implementPurchase.ts
import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { generateImplementPurchaseBillNo } from "../utils/implementPurchase.js";
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

const isTractorOperated = (t?: string | null) => /tractor/i.test(t || "");
const isSelfOperated = (t?: string | null) => /self/i.test(t || "");

const fmtINR = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const clean = (v: any) => {
  const s = v === undefined || v === null ? "" : String(v).trim();
  return s ? s : null;
};

const itemKey = (i: {
  implementId?: number | null;
  chassisNo?: string | null;
  engineNo?: string | null;
  serialNo?: string | null;
}) =>
  `${i.implementId ?? ""}|${i.chassisNo ?? ""}|${i.engineNo ?? ""}|${i.serialNo ?? ""}`;

// ─────────────────────────────────────────────────────────────
// Items validate + normalize
//  - operationType client se trust nahi karte, Implement master se lete hain
//  - Self Operated   : chassisNo + engineNo + serialNo required
//  - Tractor Operated: sirf serialNo required, chassis/engine hamesha null
//  - Duplicate check: payload ke andar + DB me (excludePurchaseId = edit ke time)
// ─────────────────────────────────────────────────────────────
type NormalizedItem = {
  implementId: number;
  operationType: string | null;
  itemName: string;
  itemCode: string;
  hsnCode: string | null;
  unit: string | null;
  taxSlab: string | null;
  categoryName: string | null;
  brandName: string | null;
  modelName: string | null;
  variantName: string | null;
  colourName: string | null;
  chassisNo: string | null;
  engineNo: string | null;
  serialNo: string | null;
  qty: number;
  stock: number;
  purchaseRate: number;
  gstPercent: number;
  gstAmount: number;
  netAmount: number;
};

const validateAndNormalizeItems = async (
  items: any[],
  excludePurchaseId?: number,
): Promise<{ error?: string; items?: NormalizedItem[] }> => {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Please add at least one item" };
  }

  if (items.some((i) => !Number(i.implementId))) {
    return { error: "Every item must be selected from Implement master" };
  }

  const implementIds = Array.from(
    new Set(items.map((i) => Number(i.implementId))),
  );

  const implementsDb = await prisma.implement.findMany({
    where: { id: { in: implementIds } },
    include: {
      category: { select: { categoryName: true } },
      brand: { select: { brandName: true } },
      model: { select: { modelName: true } },
      variant: { select: { variantName: true } },
      colour: { select: { colourName: true } },
    },
  });
  const implementMap = new Map(implementsDb.map((m) => [m.id, m]));

  const normalized: NormalizedItem[] = [];
  const seen = new Set<string>();

  for (const raw of items) {
    const implementId = Number(raw.implementId);
    const master = implementMap.get(implementId);

    if (!master) {
      return { error: `Implement not found for item "${raw.item || ""}"` };
    }

    const opType = master.operationType as string | null;
    let chassisNo = clean(raw.chassisNo);
    let engineNo = clean(raw.engineNo);
    const serialNo = clean(raw.serialNo);
    const label = `${master.itemName} (${master.itemCode})`;

    if (isTractorOperated(opType)) {
      // Tractor Operated: chassis & engine allowed nahi
      chassisNo = null;
      engineNo = null;
      if (!serialNo) return { error: `Serial No is required for ${label}` };
    } else if (isSelfOperated(opType)) {
      if (!chassisNo) return { error: `Chassis No is required for ${label}` };
      if (!engineNo) return { error: `Engine No is required for ${label}` };
      if (!serialNo) return { error: `Serial No is required for ${label}` };
    }

    // payload ke andar duplicate
    const keys: string[] = [];
    if (chassisNo) keys.push(`C:${chassisNo.toLowerCase()}`);
    if (engineNo) keys.push(`E:${engineNo.toLowerCase()}`);
    if (serialNo) keys.push(`S:${implementId}:${serialNo.toLowerCase()}`);

    for (const k of keys) {
      if (seen.has(k)) {
        return {
          error: `Duplicate Chassis/Engine/Serial No in this bill for ${label}`,
        };
      }
      seen.add(k);
    }

    const qty = 1; // har unit ka apna chassis/engine/serial hota hai
    const purchaseRate = Number(raw.pPrice || 0);
    const gstPercent = Number(raw.gstPercent || 0);

    normalized.push({
      implementId,
      operationType: opType,
      itemName: master.itemName,
      itemCode: master.itemCode,
      hsnCode: raw.hsn || master.hsnCode || null,
      unit: raw.unit || master.unit || null,
      taxSlab: String(gstPercent),
      categoryName: master.category?.categoryName || null,
      brandName: master.brand?.brandName || null,
      modelName: master.model?.modelName || null,
      variantName: master.variant?.variantName || null,
      colourName: master.colour?.colourName || null,
      chassisNo,
      engineNo,
      serialNo,
      qty,
      stock: qty,
      purchaseRate,
      gstPercent,
      gstAmount: Number(raw.gstAmount || 0),
      netAmount: Number(raw.netAmount || 0),
    });
  }

  // DB me duplicate check (dusre purchases ke saath)
  const chassisList = normalized.map((i) => i.chassisNo).filter(Boolean) as string[];
  const engineList = normalized.map((i) => i.engineNo).filter(Boolean) as string[];
  const serialList = normalized.map((i) => i.serialNo).filter(Boolean) as string[];

  const orConditions: any[] = [];
  if (chassisList.length) orConditions.push({ chassisNo: { in: chassisList } });
  if (engineList.length) orConditions.push({ engineNo: { in: engineList } });
  if (serialList.length) orConditions.push({ serialNo: { in: serialList } });

  if (orConditions.length) {
    const existing = await prisma.implementPurchaseItem.findMany({
      where: {
        ...(excludePurchaseId ? { purchaseId: { not: excludePurchaseId } } : {}),
        OR: orConditions,
      },
      select: {
        implementId: true,
        chassisNo: true,
        engineNo: true,
        serialNo: true,
      },
    });

    for (const n of normalized) {
      for (const e of existing) {
        if (n.chassisNo && e.chassisNo === n.chassisNo) {
          return { error: `Chassis No "${n.chassisNo}" already exists` };
        }
        if (n.engineNo && e.engineNo === n.engineNo) {
          return { error: `Engine No "${n.engineNo}" already exists` };
        }
        if (
          n.serialNo &&
          e.serialNo === n.serialNo &&
          e.implementId === n.implementId
        ) {
          return {
            error: `Serial No "${n.serialNo}" already exists for ${n.itemName}`,
          };
        }
      }
    }
  }

  return { items: normalized };
};

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────
export const createImplementPurchase = async (req: Request, res: Response) => {
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

    const purchaseAmount = Number(grandTotal || 0);

    if (purchaseAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Purchase amount must be greater than zero",
      });
    }

    // ITEMS VALIDATION (chassis / engine / serial rules)
    const validated = await validateAndNormalizeItems(items);
    if (validated.error || !validated.items) {
      return res
        .status(400)
        .json({ success: false, message: validated.error });
    }
    const normalizedItems = validated.items;
    const totalQty = normalizedItems.reduce((s, i) => s + i.qty, 0);

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
          message: `Insufficient balance in ${cashAccount.accountName}. Available balance: ₹${fmtINR(availableBalance)}, Purchase amount: ₹${fmtINR(purchaseAmount)}`,
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
          message: `Insufficient balance in ${bankAccount.accountName}. Available balance: ₹${fmtINR(availableBalance)}, Purchase amount: ₹${fmtINR(purchaseAmount)}`,
        });
      }
    }

    const billNo = await generateImplementPurchaseBillNo(
      Number(companyId),
      Number(financialYearId),
    );

    const user = (req as any).user;
    const { role, name, createdById } = getCreatorInfo(user);

    const purchase = await prisma.implementPurchase.create({
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
        totalQty,
        totalAmount: Number(totalAmount || 0),
        cgst: Number(cgst || 0),
        sgst: Number(sgst || 0),
        igst: Number(igst || 0),
        grandTotal: purchaseAmount,
        verifyStatus: verifyStatus || "not_verify",

        transportName: transportName || null,
        transportNo: transportNo || null,
        lrNo: lrNo || null,
        transportDate: transportDate ? new Date(transportDate) : null,
        transportCharge: Number(transportCharge || 0),

        items: {
          create: normalizedItems.map((item) => ({
            ...item,
            status: "Pending",
          })),
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
          type: "IPCP", // Implement Purchase Cash Payment
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
          type: "IPBP", // Implement Purchase Bank Payment
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
      message: "Implement Purchase created successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create Implement Purchase",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// GET ALL
// ─────────────────────────────────────────────────────────────
export const getImplementPurchases = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = user?.role?.toUpperCase().replace(/\s+/g, "_");
    const isAdmin = NON_EMPLOYEE_ROLES.includes(role);

    const whereCondition = isAdmin ? {} : { createdById: Number(user.id) };

    const purchases = await prisma.implementPurchase.findMany({
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

// ─────────────────────────────────────────────────────────────
// HISTORY (implement master ke hisaab se inward items)
// ─────────────────────────────────────────────────────────────
export const getImplementPurchaseHistory = async (
  req: Request,
  res: Response,
) => {
  try {
    const implementId = Number(req.params.implementId);

    if (!Number.isInteger(implementId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid implement ID",
      });
    }

    const items = await prisma.implementPurchaseItem.findMany({
      where: { implementId, status: "Inward" },
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
      chassisNo: item.chassisNo,
      engineNo: item.engineNo,
      serialNo: item.serialNo,
      stock: item.stock ?? item.qty,
      qty: item.qty,
      status: item.status,
    }));

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("GET IMPLEMENT PURCHASE HISTORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch implement purchase history",
      error: error?.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE
//  - Inward ho chuke items ka status/inward details preserve hota hai
//  - Inward item ko remove karne ki permission nahi
// ─────────────────────────────────────────────────────────────
export const updateImplementPurchase = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const purchase = await prisma.implementPurchase.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Implement Purchase not found",
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

    const validated = await validateAndNormalizeItems(items, id);
    if (validated.error || !validated.items) {
      return res
        .status(400)
        .json({ success: false, message: validated.error });
    }
    const normalizedItems = validated.items;
    const totalQty = normalizedItems.reduce((s, i) => s + i.qty, 0);

    // Existing items map (inward details preserve karne ke liye)
    const existingMap = new Map(purchase.items.map((i) => [itemKey(i), i]));
    const newKeys = new Set(normalizedItems.map((i) => itemKey(i)));

    const removedInward = purchase.items.find(
      (i) => i.status === "Inward" && !newKeys.has(itemKey(i)),
    );
    if (removedInward) {
      return res.status(400).json({
        success: false,
        message: `Item "${removedInward.itemName}" is already inwarded and cannot be removed`,
      });
    }

    const updatedPurchase = await prisma.$transaction(async (tx) => {
      await tx.implementPurchaseItem.deleteMany({
        where: { purchaseId: id },
      });

      return tx.implementPurchase.update({
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
          totalQty,
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
            create: normalizedItems.map((item) => {
              const old = existingMap.get(itemKey(item));
              return {
                ...item,
                status: old?.status || "Pending",
                inwardById: old?.inwardById ?? null,
                inwardBy: old?.inwardBy ?? null,
                inwardType: old?.inwardType ?? null,
                inwardDate: old?.inwardDate ?? null,
                inwardLocation: old?.inwardLocation ?? null,
                grnNumber: old?.grnNumber ?? null,
                grnDate: old?.grnDate ?? null,
                grnRecordDate: old?.grnRecordDate ?? null,
              };
            }),
          },
        },
        include: {
          account: true,
          items: true,
        },
      });
    });

    return res.json({
      success: true,
      data: updatedPurchase,
      message: "Implement Purchase updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update Implement Purchase",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────────────────────────
export const getImplementPurchaseById = async (req: Request, res: Response) => {
  try {
    const purchase = await prisma.implementPurchase.findUnique({
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

// ─────────────────────────────────────────────────────────────
// VERIFY
// ─────────────────────────────────────────────────────────────
export const verifyImplementPurchase = async (req: Request, res: Response) => {
  try {
    await prisma.implementPurchase.update({
      where: { id: Number(req.params.id) },
      data: { verifyStatus: "verify" },
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE (inward ho chuke items wali purchase delete nahi hogi)
// ─────────────────────────────────────────────────────────────
export const deleteImplementPurchase = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const inwardCount = await prisma.implementPurchaseItem.count({
      where: { purchaseId: id, status: "Inward" },
    });

    if (inwardCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete: some items are already inwarded",
      });
    }

    await prisma.implementPurchase.delete({ where: { id } });

    return res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────────────────────
// BILL NO
// ─────────────────────────────────────────────────────────────
export const getImplementPurchaseBillNo = async (
  req: Request,
  res: Response,
) => {
  try {
    const { companyId, financialYearId } = req.query;

    const billNo = await generateImplementPurchaseBillNo(
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

// ─────────────────────────────────────────────────────────────
// ITEM STATUS (Inward)
// ─────────────────────────────────────────────────────────────
export const updateImplementPurchaseItemStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { status, location, grnNumber, grnDate, grnRecordDate } = req.body;

    const user = (req as any).user;
    const { role, name, createdById: inwardById } = getCreatorInfo(user);

    const updateData: any = { status };

    if (status === "Inward") {
      updateData.inwardById = inwardById;
      updateData.inwardBy = name;
      updateData.inwardType = role;
      updateData.inwardDate = new Date();
      updateData.inwardLocation = location || null;
      updateData.grnNumber = grnNumber || null;
      updateData.grnDate = grnDate ? new Date(grnDate) : null;
      updateData.grnRecordDate = grnRecordDate ? new Date(grnRecordDate) : null;
    }

    const item = await prisma.implementPurchaseItem.update({
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

export const getImplementInventory = async (req: Request, res: Response) => {
  try {
const purchases = await prisma.implementPurchase.findMany({
  include: { account: true, items: true },
  orderBy: { id: "desc" },
})

    const data = purchases.flatMap((purchase) =>
      purchase.items.map((item) => {
        const inwardDate = item.inwardDate;

        const ageDay = inwardDate
          ? Math.floor(
              (Date.now() - new Date(inwardDate).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0;

        return {
          id: item.id,
          status:
            item.status === "Booked"
              ? "Booked"
              : item.status === "Inward"
                ? "Present"
                : "Transit",

          location: item.inwardLocation || purchase.purchaseLocation || "",

          billNo: purchase.billNo,
          purchaseBillNo: purchase.purchaseBillNo,
          supplierName: purchase.account?.accountName || "",

          itemName: item.itemName,
          itemCode: item.itemCode,
          categoryName: item.categoryName,
          brandName: item.brandName,
          modelName: item.modelName,
          variantName: item.variantName,
          colour: item.colourName,
          operationType: item.operationType,

          chassisNo: item.chassisNo,
          engineNo: item.engineNo,
          serialNo: item.serialNo,

          qty: item.qty,
          stock: item.stock ?? item.qty,
          purchaseRate: item.purchaseRate,

          grnNo: item.grnNumber,
          grnDate: item.grnDate,
          grnRecordDate: item.grnRecordDate,

          inWardDate: item.inwardDate,
          inWardTime: item.inwardDate,
          inwardBy: item.inwardBy,
          ageDay,
        };
      }),
    );

    return res.json({ success: true, data });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch implement inventory" });
  }
};