import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { generateCashReceiptVoucher } from "../utils/generateCashReceiptVoucher.js";
// ==========================
// Get All Cash Payments
// ==========================
export const getcashReceipt = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const cashReceipts = await prisma.cashReceipt.findMany({
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
        // purchase: {
        //   select: {
        //     id: true,
        //     billNo: true,
        //   },
        // },
        // lead: {
        //   select: {
        //     id: true,
        //     leadNo: true,
        //   },
        // },
      },
    });

    res.status(200).json(cashReceipts);
  } catch (error) {
    console.log(error);
    res.status(500).json({
   message: "Failed to fetch cash receipts"
    });
  }
};

// ==========================
// Get Single Cash Payment
// ==========================
export const getcashReceiptById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    const payment = await prisma.cashReceipt.findUnique({
      where: { id },
      include: {
        cashAccount: true,
        oppAccount: true,
        // purchase: true,
        lead: true,
      },
    });

    if (!payment) {
      res.status(404).json({
      message: "Cash Receipt not found"
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
// export const generateCashReceiptVoucher = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const lastVoucher = await prisma.cashPayment.findFirst({
//       orderBy: {
//         id: "desc",
//       },
//     });

//     let nextNumber = 1;

//     if (lastVoucher) {
//       const parts = lastVoucher.voucherNo.split("/");
//       nextNumber = Number(parts[2]) + 1;
//     }

//     const voucherNo = `CP/26-27/${String(nextNumber).padStart(3, "0")}`;

//     res.json({
//       voucherNo,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       message: "Unable to generate voucher number",
//     });
//   }
// };

// ==========================
// Create Cash Payment
// ==========================


export const createCashReceipt = async (
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
      leadId,
      amount,
      narration,
      type,
    } = req.body;

 if (!financialYearId) {
  res.status(400).json({
    message: "Financial Year is required",
  });
  return;
}

    const voucherNo = await generateCashReceiptVoucher();

    const role = (req as any).user?.role;
    const name = (req as any).user?.name;

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
          createdBy: name,
        },
      });

      // Cash Account Increase
      await tx.account.update({
        where: {
          id: Number(cashAccountId),
        },
        data: {
          closingBalance: {
            increment: Number(amount),
          },
        },
      });

      // Opposite Account Decrease
      await tx.account.update({
        where: {
          id: Number(oppAccountId),
        },
        data: {
          closingBalance: {
            decrement: Number(amount),
          },
        },
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