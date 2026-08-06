import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { generateCashPaymentVoucher } from "../utils/generateCashPaymentVoucher.js";
import ExcelJS from "exceljs";
// ==========================
// Get All Cash Payments
// ==========================
export const getCashPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const role = user?.role?.toUpperCase();

    const whereClause: any = {};

    if (role === "BRANCH") {
      whereClause.branchId = Number(user.branchId);
    }

    const cashPayments = await prisma.cashPayment.findMany({
      where: whereClause,
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
         employee: {
    select: {
      id: true,
      employeeName: true,
    },
  },
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

export const getCashPaymentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;
    const role = user?.role?.toUpperCase();

    const whereClause: any = { id };
    if (role === "BRANCH") {
      whereClause.branchId = Number(user.branchId);
    }

    const payment = await prisma.cashPayment.findFirst({
      where: whereClause,
      include: {
        cashAccount: true,
        oppAccount: true,
        purchase: true,
          employee: {
    select: {
      id: true,
      employeeName: true,
    },
  },
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

export const createCashPayment = async (req: Request, res: Response): Promise<void> => {
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

   const user = (req as any).user;
const role = user?.role?.toUpperCase();
const name = user?.employeeName || user?.name || "Admin";

    if (role === "BRANCH" && !user?.branchId) {
      res.status(400).json({
        success: false,
        message: "Branch ID missing from token — cannot create cash payment",
      });
      return;
    }

    const voucherNo = await generateCashPaymentVoucher();

    const payment = await prisma.$transaction(async (tx) => {
      const data = await tx.cashPayment.create({
        data: {
          companyId: Number(companyId),
          financialYearId: Number(financialYearId),
          voucherNo,
          date: new Date(date),
          type: "CP",
          cashAccountId: Number(cashAccountId),
          oppAccountId: Number(oppAccountId),
          purchaseId: purchaseId ? Number(purchaseId) : null,
          leadId: leadId ? Number(leadId) : null,
          amount: Number(amount),
          narration,
       createdById: Number(user.id),
createdType: role,
createdBy: name,
         branchId: user?.branchId ? Number(user.branchId) : null,
        },
      });

      await tx.account.update({
        where: { id: Number(cashAccountId) },
        data: { closingBalance: { decrement: Number(amount) } },
      });

      await tx.account.update({
        where: { id: Number(oppAccountId) },
        data: { closingBalance: { increment: Number(amount) } },
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


export const exportCashPaymentExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const payments = await prisma.cashPayment.findMany({
      orderBy: {
        id: "desc",
      },
      include: {
        cashAccount: {
          select: {
            accountName: true,
          },
        },
        oppAccount: {
          select: {
            accountName: true,
          },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Cash Payment Register");

    worksheet.columns = [
      { header: "Sr No", key: "sr", width: 10 },
      { header: "Date", key: "date", width: 15 },
      { header: "Voucher No", key: "voucherNo", width: 20 },
      { header: "Type", key: "type", width: 15 },
      { header: "Cash Account", key: "cashAccount", width: 30 },
      { header: "Opp. Account", key: "oppAccount", width: 30 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Narration", key: "narration", width: 40 },
      { header: "Created Type", key: "createdType", width: 20 },
      { header: "Created By", key: "createdBy", width: 20 },
    ];

    worksheet.getRow(1).font = {
      bold: true,
    };

    payments.forEach((item, index) => {
      worksheet.addRow({
        sr: index + 1,
        date: new Date(item.date).toLocaleDateString("en-GB"),
        voucherNo: item.voucherNo,
        type: item.type,
        cashAccount: item.cashAccount?.accountName,
        oppAccount: item.oppAccount?.accountName,
        amount: item.amount,
        narration: item.narration,
        createdType: item.createdType,
        createdBy: item.createdBy,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=CashPaymentRegister.xlsx"
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Failed to export excel",
    });
  }
};