import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { generateCashReceiptVoucher } from "../utils/generateCashReceiptVoucher.js";
import ExcelJS from "exceljs";
// ==========================
// Get All Cash Payments
// ==========================
export const getcashReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const role = user?.role?.toUpperCase();

    const whereClause: any = {};
    if (role === "BRANCH") {
      whereClause.branchId = Number(user.branchId);
    }

    const cashReceipts = await prisma.cashReceipt.findMany({
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
      },
    });

    res.status(200).json(cashReceipts);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to fetch cash receipts",
    });
  }
};

export const getcashReceiptById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;
    const role = user?.role?.toUpperCase();

    const whereClause: any = { id };
    if (role === "BRANCH") {
      whereClause.branchId = Number(user.branchId);
    }

    const payment = await prisma.cashReceipt.findFirst({
      where: whereClause,
      include: {
        cashAccount: true,
        oppAccount: true,
        lead: true,
      },
    });

    if (!payment) {
      res.status(404).json({
        message: "Cash Receipt not found",
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

export const createCashReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      companyId,
      financialYearId,
      date,
      cashAccountId,
      oppAccountId,
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

    if (role === "BRANCH" && !user?.branchId) {
      res.status(400).json({
        success: false,
        message: "Branch ID missing from token — cannot create cash receipt",
      });
      return;
    }

    const voucherNo = await generateCashReceiptVoucher();

    const receipt = await prisma.$transaction(async (tx) => {
      const data = await tx.cashReceipt.create({
        data: {
          companyId: Number(companyId),
          financialYearId: Number(financialYearId),
          voucherNo,
          date: new Date(date),
          type: "CR",
          cashAccountId: Number(cashAccountId),
          oppAccountId: Number(oppAccountId),
          leadId: leadId ? Number(leadId) : null,
          amount: Number(amount),
          narration,
          createdType: role,
          createdBy: user?.name,
          branchId: role === "BRANCH" ? Number(user.branchId) : null,
        },
      });

      await tx.account.update({
        where: { id: Number(cashAccountId) },
        data: { closingBalance: { increment: Number(amount) } },
      });

      await tx.account.update({
        where: { id: Number(oppAccountId) },
        data: { closingBalance: { decrement: Number(amount) } },
      });

      return data;
    });

    res.status(201).json(receipt);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Unable to create cash receipt",
    });
  }
};

// ==========================
// Update Cash Payment
// ==========================
export const updateCashReceipt = async (
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
     
      leadId,
      amount,
      narration,
    } = req.body;

    const payment = await prisma.cashReceipt.update({
      where: {
        id,
      },
    data: {
  date: new Date(date),
  type,
  cashAccountId: Number(cashAccountId),
  oppAccountId: Number(oppAccountId),
  leadId: leadId ? Number(leadId) : null,
  amount: Number(amount),
  narration,
},
    });

    res.json(payment);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Unable to update cash Receipt",
    });
  }
};

// ==========================
// Delete Cash Payment
// ==========================
export const deleteCashReceipt = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    await prisma.cashReceipt.delete({
      where: {
        id,
      },
    });

    res.json({
      message: "Cash Receipt deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Unable to delete cash Receipt",
    });
  }
};
export const getCashReceiptVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const voucherNo = await generateCashReceiptVoucher();

    res.status(200).json({
      success: true,
      voucherNo,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to generate voucher no",
    });
  }
};
export const exportCashReceiptExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const receipts = await prisma.cashReceipt.findMany({
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
    const worksheet = workbook.addWorksheet("Cash Receipt Register");

    worksheet.columns = [
      { header: "Sr No", key: "sr", width: 10 },
      { header: "Date", key: "date", width: 15 },
      { header: "Voucher No", key: "voucherNo", width: 20 },
      { header: "Type", key: "type", width: 12 },
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

    receipts.forEach((item, index) => {
      worksheet.addRow({
        sr: index + 1,
        date: item.date
          ? new Date(item.date).toLocaleDateString("en-GB")
          : "",
        voucherNo: item.voucherNo,
        type: item.type,
        cashAccount: item.cashAccount?.accountName || "",
        oppAccount: item.oppAccount?.accountName || "",
        amount: Number(item.amount),
        narration: item.narration || "",
        createdType: item.createdType || "",
        createdBy: item.createdBy || "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="CashReceiptRegister.xlsx"'
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Unable to export Cash Receipt",
    });
  }
};