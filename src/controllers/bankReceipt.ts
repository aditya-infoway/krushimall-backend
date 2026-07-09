import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { generateBankReceiptVoucher } from "../utils/generateBankReceiptVoucher.js";
import ExcelJS from "exceljs";

export const getBankReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const role = user?.role?.toUpperCase();

    const whereClause: any = {};
    if (role === "BRANCH") {
      whereClause.branchId = Number(user.branchId);
    }

    const receipts = await prisma.bankReceipt.findMany({
      where: whereClause,
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
        lead: {
          select: {
            id: true,
            quotationNo: true,
          },
        },
      },
    });

    res.status(200).json(receipts);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to fetch bank receipts",
    });
  }
};

export const getBankReceiptById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;
    const role = user?.role?.toUpperCase();

    const whereClause: any = { id };
    if (role === "BRANCH") {
      whereClause.branchId = Number(user.branchId);
    }

    const receipt = await prisma.bankReceipt.findFirst({
      where: whereClause,
      include: {
        bankAccount: true,
        oppAccount: true,
        lead: true,
      },
    });

    if (!receipt) {
      res.status(404).json({
        message: "Bank Receipt not found",
      });
      return;
    }

    res.json(receipt);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const createBankReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      companyId,
      financialYearId,
      date,
      bankAccountId,
      oppAccountId,
      leadId,
      amount,
      narration,
      paymentType,
      chequeNo,
      chequeDate,
      chequeClearDate,
    } = req.body;

    const user = (req as any).user;
    const role = user?.role?.toUpperCase();

    if (role === "BRANCH" && !user?.branchId) {
      res.status(400).json({
        success: false,
        message: "Branch ID missing from token — cannot create bank receipt",
      });
      return;
    }

    const voucherNo = await generateBankReceiptVoucher();

    const receipt = await prisma.$transaction(async (tx) => {
      const data = await tx.bankReceipt.create({
        data: {
          companyId: Number(companyId),
          financialYearId: Number(financialYearId),

          voucherNo,
          date: new Date(date),
          type: "BR",

          bankAccountId: Number(bankAccountId),
          oppAccountId: Number(oppAccountId),

          leadId: leadId ? Number(leadId) : null,

          amount: Number(amount),

          paymentType,

          chequeNo,
          chequeDate: chequeDate ? new Date(chequeDate) : null,
          chequeClearDate: chequeClearDate ? new Date(chequeClearDate) : null,

          narration,

          createdType: role,
          createdBy: user?.name,
          branchId: role === "BRANCH" ? Number(user.branchId) : null,
        },
      });

      await tx.account.update({
        where: { id: Number(bankAccountId) },
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
      message: "Unable to create Bank Receipt",
    });
  }
};
export const getBankReceiptVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const voucherNo = await generateBankReceiptVoucher();

    res.json({
      success: true,
      voucherNo,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Unable to generate voucher",
    });
  }
};

export const updateBankReceipt = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    const {
      date,
      bankAccountId,
      oppAccountId,
      leadId,
      amount,
      narration,
      paymentType,
      chequeNo,
      chequeDate,
      chequeClearDate,
    } = req.body;

    const receipt = await prisma.bankReceipt.update({
      where: { id },
      data: {
        date: new Date(date),
        bankAccountId: Number(bankAccountId),
        oppAccountId: Number(oppAccountId),
        leadId: leadId ? Number(leadId) : null,
        amount: Number(amount),

        paymentType,

        chequeNo,
        chequeDate: chequeDate ? new Date(chequeDate) : null,
        chequeClearDate: chequeClearDate
          ? new Date(chequeClearDate)
          : null,

        narration,
      },
    });

    res.json(receipt);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Unable to update Bank Receipt",
    });
  }
};
export const deleteBankReceipt = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    await prisma.bankReceipt.delete({
      where: { id },
    });

    res.json({
      message: "Bank Receipt deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Unable to delete Bank Receipt",
    });
  }
};


export const exportBankReceiptExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const receipts = await prisma.bankReceipt.findMany({
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
    const worksheet = workbook.addWorksheet("Bank Receipt Register");

    worksheet.columns = [
      { header: "Sr No", key: "sr", width: 10 },
      { header: "Date", key: "date", width: 15 },
      { header: "Voucher No", key: "voucherNo", width: 20 },
      { header: "Type", key: "type", width: 10 },
      { header: "Bank Account", key: "bankAccount", width: 30 },
      { header: "Opp. Account", key: "oppAccount", width: 30 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Payment Type", key: "paymentType", width: 18 },
      { header: "Cheque No", key: "chequeNo", width: 18 },
      { header: "Cheque Date", key: "chequeDate", width: 18 },
      { header: "Cheque Clear Date", key: "chequeClearDate", width: 20 },
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
        bankAccount: item.bankAccount?.accountName || "",
        oppAccount: item.oppAccount?.accountName || "",
        amount: Number(item.amount),
        paymentType: item.paymentType || "",
        chequeNo: item.chequeNo || "",
        chequeDate: item.chequeDate
          ? new Date(item.chequeDate).toLocaleDateString("en-GB")
          : "",
        chequeClearDate: item.chequeClearDate
          ? new Date(item.chequeClearDate).toLocaleDateString("en-GB")
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
      'attachment; filename="BankReceiptRegister.xlsx"'
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Unable to export Bank Receipt",
    });
  }
};