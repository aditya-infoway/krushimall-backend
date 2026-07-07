import prisma from "../lib/prisma.js";
import { Request, Response } from "express";
import { generateBankPaymentVoucher } from "../utils/generateBankPaymentVoucher.js";
import ExcelJS from "exceljs";
export const getBankPayments = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await prisma.bankPayment.findMany({
      orderBy: {
        id: "desc",
      },
      include: {
        bankAccount: {
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
      },
    });

    res.json(data);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Failed to fetch bank payments",
    });
  }
};
export const getBankPaymentById = async (
  req: Request,
  res: Response
) => {
  try {
    const payment = await prisma.bankPayment.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        bankAccount: true,
        oppAccount: true,
        purchase: true,
      },
    });

    if (!payment) {
      return res.status(404).json({
        message: "Not found",
      });
    }

    res.json(payment);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Error",
    });
  }
};
export const getBankPaymentVoucher = async (
  req: Request,
  res: Response
) => {
  try {
    const voucherNo = await generateBankPaymentVoucher();

    res.json({
      success: true,
      voucherNo,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Unable to generate voucher",
    });
  }
};
export const createBankPayment = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      companyId,
      financialYearId,
      date,
      bankAccountId,
      oppAccountId,
      purchaseId,
      amount,
      narration,
      paymentMode,
      chequeNo,
      chequeDate,
      clearDate,
    } = req.body;

    const voucherNo = await generateBankPaymentVoucher();

    const role = (req as any).user?.role || "Admin";
    const name = (req as any).user?.name || "Admin";

    const payment = await prisma.$transaction(async (tx) => {
      const data = await tx.bankPayment.create({
        data: {
          companyId: Number(companyId),
          financialYearId: Number(financialYearId),

          voucherNo,

          type: "BP",

          date: new Date(date),

          bankAccountId: Number(bankAccountId),

          oppAccountId: Number(oppAccountId),

          purchaseId: purchaseId
            ? Number(purchaseId)
            : null,

          amount: Number(amount),

          narration,

          paymentMode,

          chequeNo,

          chequeDate: chequeDate
            ? new Date(chequeDate)
            : null,

          clearDate: clearDate
            ? new Date(clearDate)
            : null,

          createdBy: name,

          createdType: role,
        },
      });

      await tx.account.update({
        where: {
          id: Number(bankAccountId),
        },
        data: {
          closingBalance: {
            decrement: Number(amount),
          },
        },
      });

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
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Unable to create Bank Payment",
    });
  }
};
export const updateBankPayment = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const payment = await prisma.bankPayment.update({
      where: { id },
      data: req.body,
    });

    res.json(payment);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Unable to update",
    });
  }
};
export const deleteBankPayment = async (
  req: Request,
  res: Response
) => {
  try {
    await prisma.bankPayment.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    res.json({
      message: "Deleted successfully",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Unable to delete",
    });
  }
};
export const exportBankPaymentExcel = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await prisma.bankPayment.findMany({
      orderBy: {
        id: "desc",
      },
      include: {
        bankAccount: {
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
    const worksheet = workbook.addWorksheet("Bank Payment Register");

    worksheet.columns = [
      { header: "Sr No", key: "sr", width: 10 },
      { header: "Date", key: "date", width: 18 },
      { header: "Voucher No", key: "voucherNo", width: 22 },
      { header: "Type", key: "type", width: 12 },
      { header: "Bank Account", key: "bankAccount", width: 30 },
      { header: "Opp. Account", key: "oppAccount", width: 30 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Payment Mode", key: "paymentMode", width: 18 },
      { header: "Cheque No", key: "chequeNo", width: 18 },
      { header: "Cheque Date", key: "chequeDate", width: 18 },
      { header: "Clear Date", key: "clearDate", width: 18 },
      { header: "Narration", key: "narration", width: 40 },
      { header: "Created Type", key: "createdType", width: 18 },
      { header: "Created By", key: "createdBy", width: 20 },
    ];

    worksheet.getRow(1).font = {
      bold: true,
    };

    data.forEach((item, index) => {
      worksheet.addRow({
        sr: index + 1,
        date: item.date
          ? new Date(item.date).toLocaleDateString("en-GB")
          : "",
        voucherNo: item.voucherNo,
        type: item.type,
        bankAccount: item.bankAccount?.accountName || "",
        oppAccount: item.oppAccount?.accountName || "",
        amount: Number(item.amount),
        paymentMode: item.paymentMode || "",
        chequeNo: item.chequeNo || "",
        chequeDate: item.chequeDate
          ? new Date(item.chequeDate).toLocaleDateString("en-GB")
          : "",
        clearDate: item.clearDate
          ? new Date(item.clearDate).toLocaleDateString("en-GB")
          : "",
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
      'attachment; filename="BankPaymentRegister.xlsx"'
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Unable to export Bank Payment",
    });
  }
};