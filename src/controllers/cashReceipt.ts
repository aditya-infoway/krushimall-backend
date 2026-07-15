import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { generateCashReceiptVoucher } from "../utils/generateCashReceiptVoucher.js";
import ExcelJS from "exceljs";
import puppeteer from "puppeteer";
import { getFileUrl } from "../utils/getFileUrl.js";

// ==========================
// Get All Cash Payments
// ==========================
export const getcashReceipt = async (
  req: Request,
  res: Response,
): Promise<void> => {
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

export const getcashReceiptById = async (
  req: Request,
  res: Response,
): Promise<void> => {
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

export const createCashReceipt = async (
  req: Request,
  res: Response,
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
  res: Response,
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
  res: Response,
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
  res: Response,
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
  res: Response,
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
        date: item.date ? new Date(item.date).toLocaleDateString("en-GB") : "",
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
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="CashReceiptRegister.xlsx"',
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

export const printCashReceipt = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;
    const role = user?.role?.toUpperCase();

    const whereClause: any = { id };
    if (role === "BRANCH") {
      whereClause.branchId = Number(user.branchId);
    }

    const receipt = await prisma.cashReceipt.findFirst({
      where: whereClause,
      include: {
        cashAccount: true,
        oppAccount: true,
        lead: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!receipt) {
      res.status(404).json({
        success: false,
        message: "Cash Receipt not found",
      });
      return;
    }

    const company = await prisma.company.findFirst();

    // Prefer the lead's customer details when this receipt came from a lead
    const receiver: any = receipt.lead?.customer || receipt.oppAccount;

    const formatCurrency = (amount: number) => {
      return (
        amount?.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "0.00"
      );
    };

    // Convert number to words (Indian format)
    const numberToWords = (num: number) => {
      const ones = [
        "",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen",
      ];
      const tens = [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
      ];

      const convertHundreds = (n: number): string => {
        if (n < 20) return ones[n];
        if (n < 100) {
          return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
        }
        return (
          ones[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 ? " " + convertHundreds(n % 100) : "")
        );
      };

      if (num === 0) return "Zero";

      const crore = Math.floor(num / 10000000);
      const lakh = Math.floor((num % 10000000) / 100000);
      const thousand = Math.floor((num % 100000) / 1000);
      const remainder = num % 1000;

      let result = "";
      if (crore) result += convertHundreds(crore) + " Crore ";
      if (lakh) result += convertHundreds(lakh) + " Lakh ";
      if (thousand) result += convertHundreds(thousand) + " Thousand ";
      if (remainder) result += convertHundreds(remainder);

      return result.trim() + " Only";
    };

    const amount = Number(receipt.amount);
    const amountInWords = numberToWords(Math.round(amount));
    const formattedDate = new Date(receipt.date).toLocaleDateString("en-GB");
const logoUrl = getFileUrl(company?.logo);

    const renderCopy = (copyLabel: "Customer Copy" | "Company Copy") => `
  <div class="voucher">
    <div class="header-section">
     <div class="logo-wrap">
  ${
    logoUrl
      ? `<img src="${logoUrl}" class="company-logo" />`
      : `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.3"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`
  }
</div>      <div class="company-info">
        <div class="company-name">${company?.companyName || ""}</div>
       <div class="company-details">
  ${(company?.addressLine1 || "").toUpperCase()} 
</div>
        <div class="company-details">
          <b>Dist.</b> ${company?.city || ""}, <b>State:</b> ${company?.state || ""}, <b>State Code:</b> ${company?.stateCode || ""}, <b>Pin-</b>${company?.pincode || ""}.
        </div>
        ${
          company?.gstNumber
            ? `<div class="company-details"><b>GSTIN/UIN:</b> ${company.gstNumber} | <b>CIN:</b></div>`
            : ""
        }
        <div class="company-details"><b>PAN:</b> ${company?.panNumber || ""}</div>
      </div>
    </div>

    <div class="banner">
      <span>RECEIPT VOUCHER</span>
      <span class="copy-tag">${copyLabel}</span>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel-title">Receipt Info</div>
        <table>
          <tr><td>Receipt No:</td><td>${receipt.voucherNo}</td></tr>
          <tr><td>Date:</td><td>${formattedDate}</td></tr>
          <tr><td>Payment Type:</td><td>${receipt.type}</td></tr>
          <tr><td>Payment Mode:</td><td>${(receipt as any).paymentMode || "-"}</td></tr>
<tr class="amount-row"><td>Amount:</td><td>₹ ${formatCurrency(amount)}</td></tr>
          <tr><td>Narration:</td><td>${receipt.narration || "-"}</td></tr>
        </table>
      </div>
      <div class="panel">
        <div class="panel-title">Received With Thanks From</div>
        <table>
          <tr><td>Name:</td><td>${receiver?.accountName || receiver?.name || ""}</td></tr>
          <tr><td>Address:</td><td>${receiver?.address1 || receiver?.address || "-"}</td></tr>
          <tr><td>Mobile No:</td><td>${receiver?.mobile || "-"}</td></tr>
          <tr><td>Pin Code:</td><td>${receiver?.pincode || "-"}</td></tr>
        </table>
      </div>
    </div>

    <div class="sum-box">
      <div>
        <div class="sum-label">The Sum Of :</div>
        <div class="sum-words">${amountInWords}</div>
      </div>
      <div class="sum-amount">₹ ${formatCurrency(amount)}</div>
    </div>

    <div class="signature-section">
      <div class="signature-box">Signature of Customer</div>
      <div class="signature-box">Authorised Signatory</div>
    </div>
  </div>
`;

    const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Receipt Voucher</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        width: 210mm;
        height: 297mm;
      }
      body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        color: #1f2937;
        padding: 14px 20px;
        background: #fff;
      }

      .voucher {
        border: 1px solid #d1d5db;
        margin-bottom: 16px;
        page-break-inside: avoid;
      }

      /* ---- Header ---- */
 .header-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 18px 10px;
}
.logo-wrap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.company-logo {
  max-width: 60px;
  max-height: 60px;
  object-fit: contain;
}
      .company-name {
        font-size: 19px;
        font-weight: 700;
        color: #1e40af;
        margin-bottom: 3px;
      }
      .company-details {
        font-size: 11px;
        line-height: 1.4;
        color: #1f2937;
      }

      /* ---- Blue banner ---- */
      .banner {
        background: #1e40af;
        color: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 18px;
        font-weight: 700;
        font-size: 13px;
        letter-spacing: 0.3px;
      }
      .copy-tag {
        background: #fff;
        color: #1e40af;
        font-size: 11px;
        font-weight: 600;
        padding: 3px 12px;
        border-radius: 4px;
      }

      /* ---- Two info panels ---- */
      .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        padding: 12px 18px;
      }
      .panel { border: 1px solid #d1d5db; }
      .panel-title {
        background: #1e40af;
        color: #fff;
        font-weight: 700;
        font-size: 11.5px;
        padding: 6px 14px;
      }
      .panel table { width: 100%; border-collapse: collapse; }
.panel table td {
  padding: 8px 14px;
  font-size: 11.5px;
  border-bottom: 1px dashed #e5e7eb;
  vertical-align: top;
}
.panel table tr:last-child td { border-bottom: none; }
.panel table td:first-child {
  color: #1f2937; 
  font-weight: 600;
  width: 38%;
  white-space: nowrap;
}
.panel table td:last-child {
    color: #1f2937; 
  font-weight: 600;
}
.panel table tr.amount-row td:last-child {
  font-weight: 700;
  font-size: 13px;
  color: #121418;
}

.tear-line {
  border-top: 1.5px dashed #0b5eec;
  margin: 0 0 16px;
  position: relative;
}
.tear-line::before {
  content: "✂";
  position: absolute;
  left: -2px;
  top: -9px;
  font-size: 14px;
  color: #0658e6;
  background: #fff;
  padding: 0 4px;
}

      /* ---- Sum box ---- */
      .sum-box {
        margin: 0 18px 14px;
        border: 1.5px solid #1e40af;
        background: #eef2ff;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 16px;
      }
      .sum-label { font-size: 10.5px; color: #6b7280; margin-bottom: 1px; }
      .sum-words { font-weight: 700; font-size: 12.5px; color: #1e40af; }
      .sum-amount { font-size: 18px; font-weight: 700; color: #1e40af; }

      /* ---- Signatures ---- */
      .signature-section {
        display: flex;
        justify-content: space-between;
        padding: 26px 18px 14px;
      }
      .signature-box {
        width: 220px;
        text-align: center;
        border-top: 1px solid #9ca3af;
        padding-top: 6px;
        font-size: 11px;
        color: #374151;
      }
    </style>
  </head>
  <body>
  ${renderCopy("Customer Copy")}
  <div class="tear-line"></div>
  ${renderCopy("Company Copy")}
</body>
  </html>
`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
      displayHeaderFooter: false,
      preferCSSPageSize: false,
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=receipt-${receipt.voucherNo}-${Date.now()}.pdf`,
    );
    res.setHeader("Content-Length", pdf.length);

    res.end(pdf);
  } catch (error) {
    console.error("CASH RECEIPT PDF ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate receipt PDF",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
