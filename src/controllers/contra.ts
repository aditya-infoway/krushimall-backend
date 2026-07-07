import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { generateContraVoucher } from "../utils/generateContraVoucher.js";
import ExcelJS from "exceljs";
/* ===========================================================
   Generate Contra Voucher
=========================================================== */

export const getNextContraVoucher = async (
  req: Request,
  res: Response
) => {
  try {
    const voucherNo = await generateContraVoucher();

    return res.json({
      success: true,
      voucherNo,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate voucher number",
    });
  }
};

/* ===========================================================
   Create Contra
=========================================================== */

export const createContra = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      date,
      type,
      companyId,
      financialYearId,
      cashBankAccountId,
      oppAccountId,
      amount,
      narration,
    } = req.body;

    if (
      !date ||
      !type ||
      !companyId ||
      !financialYearId ||
      !cashBankAccountId ||
      !oppAccountId ||
      !amount
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    if (Number(cashBankAccountId) === Number(oppAccountId)) {
      return res.status(400).json({
        success: false,
        message: "Both accounts cannot be same.",
      });
    }

    const voucherNo = await generateContraVoucher();

    const cashBank = await prisma.account.findUnique({
      where: {
        id: Number(cashBankAccountId),
      },
    });

    const opposite = await prisma.account.findUnique({
      where: {
        id: Number(oppAccountId),
      },
    });

    if (!cashBank || !opposite) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    const amountValue = Number(amount);
const role = (req as any).user?.role;
const name = (req as any).user?.name;
    const contra = await prisma.$transaction(async (tx) => {
      const createdContra = await tx.contra.create({
        data: {
          voucherNo,
          date: new Date(date),
          type,
          companyId: Number(companyId),
          financialYearId: Number(financialYearId),
          cashBankAccountId: Number(cashBankAccountId),
          oppAccountId: Number(oppAccountId),
          amount: amountValue,
          narration,
          createdBy: name,
      createdType: role,
        },
      });

      let cashClosing = Number(cashBank.closingBalance || 0);
      let oppClosing = Number(opposite.closingBalance || 0);

      switch (type) {
        case "Cash Deposit":
          // Cash -> Bank
          cashClosing -= amountValue;
          oppClosing += amountValue;
          break;

        case "Cash Withdrawal":
          // Bank -> Cash
          cashClosing -= amountValue;
          oppClosing += amountValue;
          break;

        case "Bank Transfer":
          // From Bank -> To Bank
          cashClosing -= amountValue;
          oppClosing += amountValue;
          break;
      }

      await tx.account.update({
        where: {
          id: Number(cashBankAccountId),
        },
        data: {
          closingBalance: cashClosing,
        },
      });

      await tx.account.update({
        where: {
          id: Number(oppAccountId),
        },
        data: {
          closingBalance: oppClosing,
        },
      });

      return createdContra;
    });

    return res.status(201).json({
      success: true,
      message: "Contra created successfully.",
      contra,
    });
  } catch (error: any) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to create contra.",
    });
  }
};
// ==========================
// Get All Contra
// ==========================
export const getContras = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const contras = await prisma.contra.findMany({
      orderBy: {
        id: "desc",
      },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
          },
        },
        financialYear: {
          select: {
            id: true,
            financialYear: true,
          },
        },
        cashBankAccount: {
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

    res.status(200).json(contras);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to fetch contra entries",
    });
  }
};
// ==========================
// Get Contra By Id
// ==========================
export const getContraById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    const contra = await prisma.contra.findUnique({
      where: {
        id,
      },
      include: {
        company: true,
        financialYear: true,
        cashBankAccount: true,
        oppAccount: true,
      },
    });

    if (!contra) {
      res.status(404).json({
        message: "Contra not found",
      });
      return;
    }

    res.json(contra);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Something went wrong",
    });
  }
};
export const exportContraExcel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const contras = await prisma.contra.findMany({
      orderBy: {
        id: "desc",
      },
      include: {
        cashBankAccount: {
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
    const worksheet = workbook.addWorksheet("Contra Register");

    worksheet.columns = [
      { header: "Sr No", key: "sr", width: 10 },
      { header: "Date", key: "date", width: 15 },
      { header: "Voucher No", key: "voucherNo", width: 20 },
      { header: "Type", key: "type", width: 20 },
      { header: "Cash/Bank Account", key: "cashBankAccount", width: 30 },
      { header: "Opp. Account", key: "oppAccount", width: 30 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Narration", key: "narration", width: 40 },
      { header: "Created Type", key: "createdType", width: 20 },
      { header: "Created By", key: "createdBy", width: 20 },
    ];

    worksheet.getRow(1).font = {
      bold: true,
    };

    contras.forEach((item, index) => {
      worksheet.addRow({
        sr: index + 1,
        date: item.date
          ? new Date(item.date).toLocaleDateString("en-GB")
          : "",
        voucherNo: item.voucherNo,
        type: item.type,
        cashBankAccount: item.cashBankAccount?.accountName || "",
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
      'attachment; filename="ContraRegister.xlsx"'
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Unable to export Contra",
    });
  }
};