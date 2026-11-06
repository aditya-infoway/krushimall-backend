import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import ExcelJS from "exceljs";
import {
  buildLedgerTransactions,
  applyLedgerFilters,
  signedOpening,
} from "../../controllers/ledger.js";

// middleware me jo naam hai wahi use karo
const getBranchId = (req: Request): number =>
  Number((req as any).branch?.id ?? (req as any).user?.branchId);

const dr_cr = (n: number) => `${Math.abs(n).toFixed(2)} ${n >= 0 ? "Dr" : "Cr"}`;

// sirf is branch ke accounts + calculated closing
const getBranchReportRows = async (branchId: number, search?: string) => {
  const accounts = await prisma.account.findMany({
    where: {
      branchId,
      ...(search
        ? {
            OR: [
              { accountName: { contains: search, mode: "insensitive" } },
              { group: { contains: search, mode: "insensitive" } },
              { address1: { contains: search, mode: "insensitive" } },
              { city: { contains: search, mode: "insensitive" } },
              { state: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { accountName: "asc" },
    select: {
      id: true,
      accountName: true,
      group: true,
      address1: true,
      city: true,
      state: true,
      openingBalance: true,
      drCr: true,
    },
  });

  return Promise.all(
    accounts.map(async (acc) => {
      const txns = await buildLedgerTransactions(acc.id);
      const closing = txns.reduce(
        (s, t) => s + Number(t.debit || 0) - Number(t.credit || 0),
        signedOpening(acc),
      );
      return {
        ...acc,
        closingBalance: Math.abs(closing),
        drCr: closing >= 0 ? "Dr" : "Cr",
      };
    }),
  );
};

// account branch ka hi hai ya nahi (security check)
const getOwnedAccount = (accountId: number, branchId: number) =>
  prisma.account.findFirst({ where: { id: accountId, branchId } });

// ==========================================
// LEDGER REPORT
// ==========================================
export const getLedgerReport = async (req: Request, res: Response) => {
  try {
    const branchId = getBranchId(req);
    const search = req.query.search ? String(req.query.search) : undefined;

    const report = await getBranchReportRows(branchId, search);
    return res.json({ success: true, report });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch ledger report" });
  }
};

// ==========================================
// LEDGER DETAILS
// ==========================================
export const getLedgerDetails = async (req: Request, res: Response) => {
  try {
    const branchId = getBranchId(req);
    const accountId = Number(req.params.id);
    const { search, fromDate, toDate } = req.query;

    const account = await getOwnedAccount(accountId, branchId);
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    const transactions = await buildLedgerTransactions(accountId);
    const filtered = applyLedgerFilters(
      transactions,
      account,
      fromDate ? String(fromDate) : undefined,
      toDate ? String(toDate) : undefined,
      search ? String(search) : undefined,
    );

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
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch ledger" });
  }
};

// ==========================================
// EXPORT LEDGER REPORT
// ==========================================
export const exportLedgerReport = async (req: Request, res: Response) => {
  try {
    const branchId = getBranchId(req);
    const search = req.query.search ? String(req.query.search) : undefined;

    const report = await getBranchReportRows(branchId, search);

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
    worksheet.getRow(1).font = { bold: true };

    report.forEach((item, index) => {
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
    return res
      .status(500)
      .json({ success: false, message: "Unable to export ledger report" });
  }
};

// ==========================================
// EXPORT LEDGER DETAILS
// ==========================================
export const exportLedgerDetails = async (req: Request, res: Response) => {
  try {
    const branchId = getBranchId(req);
    const accountId = Number(req.params.id);
    const { search, fromDate, toDate } = req.query;

    const account = await getOwnedAccount(accountId, branchId);
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    const transactions = await buildLedgerTransactions(accountId);
    const filtered = applyLedgerFilters(
      transactions,
      account,
      fromDate ? String(fromDate) : undefined,
      toDate ? String(toDate) : undefined,
      search ? String(search) : undefined,
    );

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
    worksheet.getRow(1).font = { bold: true };

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
        balance: dr_cr(Number(item.balance || 0)),
      });
    });

    const txnRows = filtered.filter((i: any) => i.type !== "OPENING BALANCE");
    const totalDebit = txnRows.reduce((s, i) => s + Number(i.debit || 0), 0);
    const totalCredit = txnRows.reduce((s, i) => s + Number(i.credit || 0), 0);
    const closingBalance = filtered.length
      ? Number(filtered[filtered.length - 1].balance || 0)
      : 0;

    worksheet.addRow({});
    worksheet.addRow({
      particulars: "TOTAL",
      debit: totalDebit,
      credit: totalCredit,
      balance: dr_cr(closingBalance),
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
    return res
      .status(500)
      .json({ success: false, message: "Unable to export ledger details" });
  }
};