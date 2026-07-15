import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import ExcelJS from "exceljs";
export const getLedgerDetails = async (req: Request, res: Response) => {
  try {
    const accountId = Number(req.params.id);

    const { search, fromDate, toDate } = req.query;

    const account = await prisma.account.findUnique({
      where: {
        id: accountId,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    let transactions: any[] = [];

    // Cash Payments
    const cashPayments = await prisma.cashPayment.findMany({
      where: {
        OR: [
          {
            cashAccountId: accountId,
          },
          {
            oppAccountId: accountId,
          },
        ],
      },
      include: {
        cashAccount: true,
        oppAccount: true,
      },
    });

    console.log("Cash Payment Count:", cashPayments.length);
    cashPayments.forEach((item) => {
      const isCash = item.cashAccountId === accountId;

      const isOpp = item.oppAccountId === accountId;

      transactions.push({
        createdAt: item.createdAt,
        date: item.date,
        voucherNo: item.voucherNo,
        billNo: null,
        type: item.type,
        particulars: isCash
          ? item.oppAccount?.accountName
          : item.cashAccount?.accountName,
        debit: isOpp ? Number(item.amount) : 0,
        credit: isCash ? Number(item.amount) : 0,
      });
    });
    // ==========================
    // Bank Payments
    // ==========================
    const bankPayments = await prisma.bankPayment.findMany({
      where: {
        OR: [
          {
            bankAccountId: accountId,
          },
          {
            oppAccountId: accountId,
          },
        ],
      },
      include: {
        bankAccount: true,
        oppAccount: true,
      },
    });

    bankPayments.forEach((item) => {
      const isBank = item.bankAccountId === accountId;

      const isOpp = item.oppAccountId === accountId;

      transactions.push({
        createdAt: item.createdAt,
        date: item.date,
        voucherNo: item.voucherNo,
        billNo: null,
        type: item.type,
        particulars: isBank
          ? item.oppAccount?.accountName
          : item.bankAccount?.accountName,
        debit: isOpp ? Number(item.amount) : 0,
        credit: isBank ? Number(item.amount) : 0,
      });
    });
    // ==========================
    // Credit Purchase
    // ==========================
    const purchases = await prisma.purchase.findMany({
      where: {
        accountId,
      },
      include: {
        account: true,
      },
    });

    purchases.forEach((item) => {
      transactions.push({
        createdAt: item.createdAt,
        date: item.purchaseDate,
        voucherNo: "-",
        billNo: item.billNo,
        type: "PURCHASE",

        particulars: item.account?.accountName,

        // Supplier Ledger -> Credit
        debit: 0,
        credit: Number(item.grandTotal || 0),
      });
    });
//  transactions.sort((a, b) => {
//   const dateCompare =
//     new Date(a.date).getTime() - new Date(b.date).getTime();

//   if (dateCompare !== 0) return dateCompare;

//   return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
// });

    // ==========================
    // Contra Entries
    // ==========================
    const contras = await prisma.contra.findMany({
      where: {
        OR: [
          {
            cashBankAccountId: accountId,
          },
          {
            oppAccountId: accountId,
          },
        ],
      },
      include: {
        cashBankAccount: true,
        oppAccount: true,
      },
    });

    contras.forEach((item) => {
      const isCashBank = item.cashBankAccountId === accountId;

      let debit = 0;
      let credit = 0;

      switch (item.type) {
        case "Cash Deposit":
          // Cash -> Bank
          if (isCashBank) {
            credit = Number(item.amount); // Cash account
          } else {
            debit = Number(item.amount); // Bank account
          }
          break;

        case "Cash Withdrawal":
          // Bank -> Cash
          if (isCashBank) {
            credit = Number(item.amount); // Bank account
          } else {
            debit = Number(item.amount); // Cash account
          }
          break;

        case "Bank Transfer":
          // From Bank -> To Bank
          if (isCashBank) {
            credit = Number(item.amount); // From Bank
          } else {
            debit = Number(item.amount); // To Bank
          }
          break;
      }

      transactions.push({
        createdAt: item.createdAt,
        date: item.date,
        voucherNo: item.voucherNo,
        billNo: null,
        type: item.type,
        particulars: isCashBank
          ? item.oppAccount?.accountName
          : item.cashBankAccount?.accountName,
        debit,
        credit,
      });
    });
    // ==========================
// Cash Receipts
// ==========================
const cashReceipts = await prisma.cashReceipt.findMany({
  where: {
    OR: [
      { cashAccountId: accountId },
      { oppAccountId: accountId },
    ],
  },
  include: {
    cashAccount: true,
    oppAccount: true,
    lead: true,
  },
});

cashReceipts.forEach((item) => {
  const isCash = item.cashAccountId === accountId;
  const isOpp = item.oppAccountId === accountId;

  transactions.push({
    createdAt: item.createdAt,
    date: item.date,
    voucherNo: item.voucherNo,
    billNo: item.lead?.quotationNo || "-",
    type: item.type, // CR / LCR
    particulars: isCash
      ? item.oppAccount?.accountName
      : item.cashAccount?.accountName,
    debit: isCash ? Number(item.amount) : 0,
    credit: isOpp ? Number(item.amount) : 0,
  });
});
// ==========================
// Bank Receipts
// ==========================
const bankReceipts = await prisma.bankReceipt.findMany({
  where: {
    OR: [
      { bankAccountId: accountId },
      { oppAccountId: accountId },
    ],
  },
  include: {
    bankAccount: true,
    oppAccount: true,
    lead: true,
  },
});

bankReceipts.forEach((item) => {
  const isBank = item.bankAccountId === accountId;
  const isOpp = item.oppAccountId === accountId;

  transactions.push({
    createdAt: item.createdAt,
    date: item.date,
    voucherNo: item.voucherNo,
    billNo: item.lead?.quotationNo || "-",
    type: item.type, // BR / LBR / JBR
    particulars: isBank
      ? item.oppAccount?.accountName
      : item.bankAccount?.accountName,

    // Receipt increases Bank balance
    debit: isBank ? Number(item.amount) : 0,
    credit: isOpp ? Number(item.amount) : 0,
  });
});
// ==========================
// Lead Entries
// ==========================
const leads = await prisma.lead.findMany({
  where: {
    customerId: accountId,
    listOfBooking: {
      gt: 0,
    },
  },
});

leads.forEach((item) => {
  transactions.push({
    createdAt: item.createdAt,
    date: item.bookingDate || item.createdAt,
    voucherNo: item.quotationNo,
    billNo: "-",
    type: "LEAD",
    particulars: "Lead Advance",
    debit: Number(item.listOfBooking),
    credit: 0,
  });
});
// ==========================================
// SORT ALL LEDGER ENTRIES
// Date first, then created time
// ==========================================

transactions.sort((a, b) => {
  const dateA =
    new Date(a.date).getTime();

  const dateB =
    new Date(b.date).getTime();

  // Sort by transaction date
  if (dateA !== dateB) {
    return dateA - dateB;
  }

  // Same transaction date:
  // sort by record creation time
  const createdAtA =
    a.createdAt
      ? new Date(
          a.createdAt,
        ).getTime()
      : 0;

  const createdAtB =
    b.createdAt
      ? new Date(
          b.createdAt,
        ).getTime()
      : 0;

  return (
    createdAtA -
    createdAtB
  );
});
    // ==========================================
    // Opening Balance Calculation
    // ==========================================

    let openingBalance = Number(account.openingBalance || 0);

    const startDate = fromDate ? new Date(String(fromDate)) : null;

    const endDate = toDate ? new Date(String(toDate)) : null;

    if (startDate) {
      startDate.setHours(0, 0, 0, 0);
    }

    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    // Calculate opening balance using all previous transactions
    if (startDate) {
      transactions.forEach((txn) => {
        const txnDate = new Date(txn.date);
        txnDate.setHours(0, 0, 0, 0);
        if (txnDate < startDate) {
          openingBalance =
            openingBalance + Number(txn.debit || 0) - Number(txn.credit || 0);
        }
      });
    }

    // ==========================================
    // Filter Transactions
    // ==========================================

    let filteredTransactions = [...transactions];

    if (startDate || endDate) {
      filteredTransactions = filteredTransactions.filter((txn) => {
        const txnDate = new Date(txn.date);
        txnDate.setHours(0, 0, 0, 0);
        if (startDate && txnDate < startDate) {
          return false;
        }

        if (endDate && txnDate > endDate) {
          return false;
        }

        return true;
      });
    }

    // ==========================================
    // Opening Balance Entry
    // ==========================================

    filteredTransactions.unshift({
      date: startDate,
      voucherNo: "-",
      billNo: "-",
      type: "OPENING BALANCE",
      particulars: "-",
      debit: openingBalance >= 0 ? openingBalance : 0,
      credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
    });

    // ==========================================
    // Running Balance
    // ==========================================

    let runningBalance = openingBalance;

    const result = filteredTransactions.map((txn, index) => {
      if (index !== 0) {
        runningBalance =
          runningBalance + Number(txn.debit || 0) - Number(txn.credit || 0);
      }

      return {
        ...txn,
        balance: runningBalance,
      };
    });
    let filtered = result;

    if (search) {
      const value = String(search).toLowerCase();

      filtered = result.filter(
        (item) =>
          String(item.type || "")
            .toLowerCase()
            .includes(value) ||
          String(item.voucherNo || "")
            .toLowerCase()
            .includes(value) ||
          String(item.billNo || "")
            .toLowerCase()
            .includes(value) ||
          String(item.particulars || "")
            .toLowerCase()
            .includes(value),
      );
    }
   return res.json({
  success: true,
  account: {
    accountName: account.accountName,
    group: account.group,
    openingBalance: Number(account.openingBalance || 0),
    drCr: account.drCr,
  },
  transactions: filtered,
});
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch ledger",
    });
  }
};
export const getLedgerReport = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const accounts = await prisma.account.findMany({
      where: search
        ? {
            OR: [
              {
                accountName: {
                  contains: String(search),
                  mode: "insensitive",
                },
              },
              {
                group: {
                  contains: String(search),
                  mode: "insensitive",
                },
              },
              {
                address1: {
                  contains: String(search),
                  mode: "insensitive",
                },
              },
              {
                city: {
                  contains: String(search),
                  mode: "insensitive",
                },
              },
              {
                state: {
                  contains: String(search),
                  mode: "insensitive",
                },
              },
            ],
          }
        : {},
      orderBy: {
        accountName: "asc",
      },
      select: {
        id: true,
        accountName: true,
        group: true,
        address1: true,
        city: true,
        state: true,
        openingBalance: true,
        closingBalance: true,
        drCr: true,
      },
    });

    return res.json({
      success: true,
      report: accounts,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch ledger report",
    });
  }
};

export const exportLedgerReport = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const accounts = await prisma.account.findMany({
      where: search
        ? {
            OR: [
              {
                accountName: {
                  contains: String(search),
                  mode: "insensitive",
                },
              },
              {
                group: {
                  contains: String(search),
                  mode: "insensitive",
                },
              },
            ],
          }
        : {},
      orderBy: {
        accountName: "asc",
      },
      select: {
        accountName: true,
        group: true,
        address1: true,
        city: true,
        state: true,
        openingBalance: true,
        closingBalance: true,
        drCr: true,
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Ledger Report");

    worksheet.columns = [
      { header: "Sr No", key: "sr", width: 10 },
      { header: "Account Name", key: "accountName", width: 35 },
      { header: "Group", key: "group", width: 25 },
      { header: "Address", key: "address", width: 40 },
      { header: "City", key: "city", width: 20 },
      { header: "State", key: "state", width: 20 },
      { header: "Opening Balance", key: "openingBalance", width: 20 },
      { header: "Closing Balance", key: "closingBalance", width: 20 },
      { header: "Dr/Cr", key: "drCr", width: 10 },
    ];

    worksheet.getRow(1).font = {
      bold: true,
    };

    accounts.forEach((item, index) => {
      worksheet.addRow({
        sr: index + 1,
        accountName: item.accountName,
        group: item.group,
        address: item.address1 || "",
        city: item.city,
        state: item.state,
        openingBalance: Number(item.openingBalance),
        closingBalance: Number(item.closingBalance),
        drCr: item.drCr,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="LedgerReport.xlsx"',
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Unable to export ledger report",
    });
  }
};
export const exportLedgerDetails = async (
  req: Request,
  res: Response
) => {
  try {
    const accountId = Number(req.params.id);
    const { search, fromDate, toDate } = req.query;

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    let transactions: any[] = [];
 const cashPayments = await prisma.cashPayment.findMany({
      where: {
        OR: [
          {
            cashAccountId: accountId,
          },
          {
            oppAccountId: accountId,
          },
        ],
      },
      include: {
        cashAccount: true,
        oppAccount: true,
      },
    });

    console.log("Cash Payment Count:", cashPayments.length);
    cashPayments.forEach((item) => {
      const isCash = item.cashAccountId === accountId;

      const isOpp = item.oppAccountId === accountId;

      transactions.push({
        createdAt: item.createdAt,
        date: item.date,
        voucherNo: item.voucherNo,
        billNo: null,
        type: item.type,
        particulars: isCash
          ? item.oppAccount?.accountName
          : item.cashAccount?.accountName,
        debit: isOpp ? Number(item.amount) : 0,
        credit: isCash ? Number(item.amount) : 0,
      });
    });
    // ==========================
    // Bank Payments
    // ==========================
    const bankPayments = await prisma.bankPayment.findMany({
      where: {
        OR: [
          {
            bankAccountId: accountId,
          },
          {
            oppAccountId: accountId,
          },
        ],
      },
      include: {
        bankAccount: true,
        oppAccount: true,
      },
    });

    bankPayments.forEach((item) => {
      const isBank = item.bankAccountId === accountId;

      const isOpp = item.oppAccountId === accountId;

      transactions.push({
        createdAt: item.createdAt,
        date: item.date,
        voucherNo: item.voucherNo,
        billNo: null,
        type: item.type,
        particulars: isBank
          ? item.oppAccount?.accountName
          : item.bankAccount?.accountName,
        debit: isOpp ? Number(item.amount) : 0,
        credit: isBank ? Number(item.amount) : 0,
      });
    });
    // ==========================
    // Credit Purchase
    // ==========================
    const purchases = await prisma.purchase.findMany({
      where: {
        accountId,
      },
      include: {
        account: true,
      },
    });

    purchases.forEach((item) => {
      transactions.push({
        createdAt: item.createdAt,
        date: item.purchaseDate,
        voucherNo: "-",
        billNo: item.billNo,
        type: "PURCHASE",

        particulars: item.account?.accountName,

        // Supplier Ledger -> Credit
        debit: 0,
        credit: Number(item.grandTotal || 0),
      });
    });
    // transactions.sort((a, b) => {
    //   const dateCompare =
    //     new Date(a.date).getTime() - new Date(b.date).getTime();

    //   if (dateCompare !== 0) return dateCompare;

    //   return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    // });

    // ==========================
    // Contra Entries
    // ==========================
    const contras = await prisma.contra.findMany({
      where: {
        OR: [
          {
            cashBankAccountId: accountId,
          },
          {
            oppAccountId: accountId,
          },
        ],
      },
      include: {
        cashBankAccount: true,
        oppAccount: true,
      },
    });
// ==========================
// Cash Receipts
// ==========================
const cashReceipts = await prisma.cashReceipt.findMany({
  where: {
    OR: [
      { cashAccountId: accountId },
      { oppAccountId: accountId },
    ],
  },
  include: {
    cashAccount: true,
    oppAccount: true,
    lead: true,
  },
});

cashReceipts.forEach((item) => {
  const isCash = item.cashAccountId === accountId;
  const isOpp = item.oppAccountId === accountId;

  transactions.push({
    createdAt: item.createdAt,
    date: item.date,
    voucherNo: item.voucherNo,
    billNo: item.lead?.quotationNo || "-",
    type: item.type,
    particulars: isCash
      ? item.oppAccount?.accountName
      : item.cashAccount?.accountName,
    debit: isCash ? Number(item.amount) : 0,
    credit: isOpp ? Number(item.amount) : 0,
  });
});
// ==========================
// Bank Receipts
// ==========================
const bankReceipts = await prisma.bankReceipt.findMany({
  where: {
    OR: [
      { bankAccountId: accountId },
      { oppAccountId: accountId },
    ],
  },
  include: {
    bankAccount: true,
    oppAccount: true,
    lead: true,
  },
});

bankReceipts.forEach((item) => {
  const isBank = item.bankAccountId === accountId;
  const isOpp = item.oppAccountId === accountId;

  transactions.push({
    createdAt: item.createdAt,
    date: item.date,
    voucherNo: item.voucherNo,
    billNo: item.lead?.quotationNo || "-",
    type: item.type, // BR / LBR / JBR
    particulars: isBank
      ? item.oppAccount?.accountName
      : item.bankAccount?.accountName,
    debit: isBank ? Number(item.amount) : 0,
    credit: isOpp ? Number(item.amount) : 0,
  });
});
// ==========================
// Lead Entries
// ==========================
const leads = await prisma.lead.findMany({
  where: {
    customerId: accountId,
    listOfBooking: {
      gt: 0,
    },
  },
});

leads.forEach((item) => {
  transactions.push({
    createdAt: item.createdAt,
    date: item.bookingDate || item.createdAt,
    voucherNo: item.quotationNo,
    billNo: "-",
    type: "LEAD",
    particulars: "Lead Advance",
    debit: Number(item.listOfBooking),
    credit: 0,
  });
});
    contras.forEach((item) => {
      const isCashBank = item.cashBankAccountId === accountId;

      let debit = 0;
      let credit = 0;

      switch (item.type) {
        case "Cash Deposit":
          // Cash -> Bank
          if (isCashBank) {
            credit = Number(item.amount); // Cash account
          } else {
            debit = Number(item.amount); // Bank account
          }
          break;

        case "Cash Withdrawal":
          // Bank -> Cash
          if (isCashBank) {
            credit = Number(item.amount); // Bank account
          } else {
            debit = Number(item.amount); // Cash account
          }
          break;

        case "Bank Transfer":
          // From Bank -> To Bank
          if (isCashBank) {
            credit = Number(item.amount); // From Bank
          } else {
            debit = Number(item.amount); // To Bank
          }
          break;
      }

      transactions.push({
        createdAt: item.createdAt,
        date: item.date,
        voucherNo: item.voucherNo,
        billNo: null,
        type: item.type,
        particulars: isCashBank
          ? item.oppAccount?.accountName
          : item.cashBankAccount?.accountName,
        debit,
        credit,
      });
    });
    // ==========================================
// SORT ALL LEDGER ENTRIES
// Date first, then created time
// ==========================================

transactions.sort((a, b) => {
  const dateA =
    new Date(a.date).getTime();

  const dateB =
    new Date(b.date).getTime();

  // Sort by transaction date
  if (dateA !== dateB) {
    return dateA - dateB;
  }

  // Same transaction date:
  // sort by record creation time
  const createdAtA =
    a.createdAt
      ? new Date(
          a.createdAt,
        ).getTime()
      : 0;

  const createdAtB =
    b.createdAt
      ? new Date(
          b.createdAt,
        ).getTime()
      : 0;

  return (
    createdAtA -
    createdAtB
  );
});
    // ==========================================
    // Opening Balance Calculation
    // ==========================================

    let openingBalance = Number(account.openingBalance || 0);

    const startDate = fromDate ? new Date(String(fromDate)) : null;

    const endDate = toDate ? new Date(String(toDate)) : null;

    if (startDate) {
      startDate.setHours(0, 0, 0, 0);
    }

    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    // Calculate opening balance using all previous transactions
    if (startDate) {
      transactions.forEach((txn) => {
        const txnDate = new Date(txn.date);
        txnDate.setHours(0, 0, 0, 0);
        if (txnDate < startDate) {
          openingBalance =
            openingBalance + Number(txn.debit || 0) - Number(txn.credit || 0);
        }
      });
    }

    // ==========================================
    // Filter Transactions
    // ==========================================

    let filteredTransactions = [...transactions];

    if (startDate || endDate) {
      filteredTransactions = filteredTransactions.filter((txn) => {
        const txnDate = new Date(txn.date);
        txnDate.setHours(0, 0, 0, 0);
        if (startDate && txnDate < startDate) {
          return false;
        }

        if (endDate && txnDate > endDate) {
          return false;
        }

        return true;
      });
    }

    // ==========================================
    // Opening Balance Entry
    // ==========================================

    filteredTransactions.unshift({
      date: startDate,
      voucherNo: "-",
      billNo: "-",
      type: "OPENING BALANCE",
      particulars: "-",
      debit: openingBalance >= 0 ? openingBalance : 0,
      credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
    });

    // ==========================================
    // Running Balance
    // ==========================================

    let runningBalance = openingBalance;

    const result = filteredTransactions.map((txn, index) => {
      if (index !== 0) {
        runningBalance =
          runningBalance + Number(txn.debit || 0) - Number(txn.credit || 0);
      }

      return {
        ...txn,
        balance: runningBalance,
      };
    });
    let filtered = result;

    if (search) {
      const value = String(search).toLowerCase();

      filtered = result.filter(
        (item) =>
          String(item.type || "")
            .toLowerCase()
            .includes(value) ||
          String(item.voucherNo || "")
            .toLowerCase()
            .includes(value) ||
          String(item.billNo || "")
            .toLowerCase()
            .includes(value) ||
          String(item.particulars || "")
            .toLowerCase()
            .includes(value),
      );
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Ledger Details");

    worksheet.columns = [
      { header: "Sr No", key: "sr", width: 10 },
      { header: "Date", key: "date", width: 18 },
      { header: "Bill No", key: "billNo", width: 20 },
      { header: "Voucher No", key: "voucherNo", width: 20 },
      { header: "Type", key: "type", width: 20 },
      { header: "Particulars", key: "particulars", width: 35 },
      { header: "Debit", key: "debit", width: 18 },
      { header: "Credit", key: "credit", width: 18 },
      { header: "Balance", key: "balance", width: 18 },
    ];

    worksheet.getRow(1).font = {
      bold: true,
    };

    filtered.forEach((item: any, index: number) => {
      worksheet.addRow({
        sr: index + 1,
        date: item.date ? new Date(item.date).toLocaleDateString("en-GB") : "-",
       billNo: item.billNo || "-",
voucherNo: item.voucherNo || "-",
type: item.type || "-",
particulars: item.particulars || "-",
        debit: Number(item.debit || 0),
        credit: Number(item.credit || 0),
        balance: Number(item.balance || 0),
      });
    });
const totalDebit = filtered.reduce(
  (sum, item) => sum + Number(item.debit || 0),
  0
);

const totalCredit = filtered.reduce(
  (sum, item) => sum + Number(item.credit || 0),
  0
);

const closingBalance =
  filtered.length > 0
    ? Number(filtered[filtered.length - 1].balance || 0)
    : 0;

worksheet.addRow({});

worksheet.addRow({
  particulars: "TOTAL",
  debit: totalDebit,
  credit: totalCredit,
  balance: closingBalance,
});
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="LedgerDetails.xlsx"',
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Unable to export ledger details",
    });
  }
};
