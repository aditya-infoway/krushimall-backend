import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const getLedgerDetails = async (
  req: Request,
  res: Response
) => {
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
    const cashPayments =
      await prisma.cashPayment.findMany({
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
      const isCash =
        item.cashAccountId === accountId;

      const isOpp =
        item.oppAccountId === accountId;

      transactions.push({
        createdAt: item.createdAt,
        date: item.date,
        voucherNo: item.voucherNo,
        billNo: null,
        type: item.type,
        particulars: isCash
          ? item.oppAccount?.accountName
          : item.cashAccount?.accountName,
        debit: isOpp
          ? Number(item.amount)
          : 0,
        credit: isCash
          ? Number(item.amount)
          : 0,
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
  const isBank =
    item.bankAccountId === accountId;

  const isOpp =
    item.oppAccountId === accountId;

  transactions.push({
    createdAt: item.createdAt,
    date: item.date,
    voucherNo: item.voucherNo,
    billNo: null,
    type: item.type,
    particulars: isBank
      ? item.oppAccount?.accountName
      : item.bankAccount?.accountName,
    debit: isOpp
      ? Number(item.amount)
      : 0,
    credit: isBank
      ? Number(item.amount)
      : 0,
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
  transactions.sort((a, b) => {
  const dateCompare =
    new Date(a.date).getTime() -
    new Date(b.date).getTime();

  if (dateCompare !== 0) return dateCompare;

  return (
    new Date(a.createdAt).getTime() -
    new Date(b.createdAt).getTime()
  );
});

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
  const isCashBank =
    item.cashBankAccountId === accountId;

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
// Opening Balance Calculation
// ==========================================

let openingBalance = Number(account.openingBalance || 0);

const startDate = fromDate
  ? new Date(String(fromDate))
  : null;

const endDate = toDate
  ? new Date(String(toDate))
  : null;

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
        openingBalance +
        Number(txn.debit || 0) -
        Number(txn.credit || 0);
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
      runningBalance +
      Number(txn.debit || 0) -
      Number(txn.credit || 0);
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
        .includes(value)
  );
}
    return res.json({
      success: true,
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
export const getLedgerReport = async (
  req: Request,
  res: Response
) => {
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