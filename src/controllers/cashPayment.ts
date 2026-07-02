import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { generateCashPaymentVoucher } from "../utils/generateCashPaymentVoucher.js";
// ==========================
// Get All Cash Payments
// ==========================
export const getCashPayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const cashPayments = await prisma.cashPayment.findMany({
      orderBy: {
        id: "desc",
      },
      include: {
        cashAccount: {
          select: {
            id: true,
            accountName: true,
            mobile: true,
          },
        },
        oppAccount: {
          select: {
            id: true,
            accountName: true,
            mobile: true,
          },
        },
        purchase: {
          select: {
            id: true,
            billNo: true,
          },
        },
        // lead: {
        //   select: {
        //     id: true,
        //     leadNo: true,
        //   },
        // },
      },
    });

    res.status(200).json(cashPayments);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to fetch cash payments",
    });
  }
};

// ==========================
// Get Single Cash Payment
// ==========================
export const getCashPaymentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    const payment = await prisma.cashPayment.findUnique({
      where: { id },
      include: {
        cashAccount: true,
        oppAccount: true,
        purchase: true,
        // lead: true,
      },
    });

    if (!payment) {
      res.status(404).json({
        message: "Cash Payment not found",
      });
      return;
    }

    res.json(payment);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

// ==========================
// Generate Voucher Number
// ==========================
export const generateVoucherNo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const lastVoucher = await prisma.cashPayment.findFirst({
      orderBy: {
        id: "desc",
      },
    });

    let nextNumber = 1;

    if (lastVoucher) {
      const parts = lastVoucher.voucherNo.split("/");
      nextNumber = Number(parts[2]) + 1;
    }

    const voucherNo = `CP/26-27/${String(nextNumber).padStart(3, "0")}`;

    res.json({
      voucherNo,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Unable to generate voucher number",
    });
  }
};

// ==========================
// Create Cash Payment
// ==========================


export const createCashPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      companyId,
  financialYearId,
      date,
      cashAccountId,
      oppAccountId,
      purchaseId,
      leadId,
      amount,
      narration,
    } = req.body;

    if (!financialYearId) {
      res.status(400).json({
        message: "Financial Year is required",
      });
      return;
    }

  const voucherNo = await generateCashPaymentVoucher();
console.log("req.user =", (req as any).user);
console.log("role =", (req as any).user?.role);
console.log("name =", (req as any).user?.name);
    const role = (req as any).user?.role;
    const name = (req as any).user?.name;

    const payment = await prisma.$transaction(async (tx) => {
      const data = await tx.cashPayment.create({
        data: {
              companyId: Number(companyId),
    financialYearId: Number(financialYearId),
          voucherNo,
          date: new Date(date),
          type: "CP", // <-- Always save CP
          cashAccountId: Number(cashAccountId),
          oppAccountId: Number(oppAccountId),
          purchaseId: purchaseId ? Number(purchaseId) : null,
          leadId: leadId ? Number(leadId) : null,
          amount: Number(amount),
          narration,
          createdType: role,
          createdBy: name,
        },
      });

      // Cash account balance decrease
      await tx.account.update({
        where: {
          id: Number(cashAccountId),
        },
        data: {
          closingBalance: {
            decrement: Number(amount),
          },
        },
      });

      // Opposite account balance increase
      await tx.account.update({
        where: {
          id: Number(oppAccountId),
        },
        data: {
          closingBalance: {
            increment: Number(amount),
          },
        },
      });

      return data;
    });

    res.status(201).json(payment);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Unable to create cash payment",
    });
  }
};

// ==========================
// Update Cash Payment
// ==========================
export const updateCashPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    const {
      date,
      type,
      cashAccountId,
      oppAccountId,
      purchaseId,
      leadId,
      amount,
      narration,
    } = req.body;

    const payment = await prisma.cashPayment.update({
      where: {
        id,
      },
      data: {
        date: new Date(date),
        type,
        cashAccountId: Number(cashAccountId),
        oppAccountId: Number(oppAccountId),
        purchaseId: purchaseId ? Number(purchaseId) : null,
        leadId: leadId ? Number(leadId) : null,
        amount: Number(amount),
        narration,
      },
    });

    res.json(payment);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Unable to update cash payment",
    });
  }
};

// ==========================
// Delete Cash Payment
// ==========================
export const deleteCashPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    await prisma.cashPayment.delete({
      where: {
        id,
      },
    });

    res.json({
      message: "Cash Payment deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Unable to delete cash payment",
    });
  }
};
export const getCashPaymentVoucher = async (
  req: Request,
  res: Response
) => {
  try {
    const voucherNo = await generateCashPaymentVoucher();

    return res.status(200).json({
      success: true,
      voucherNo,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate voucher no",
    });
  }
};