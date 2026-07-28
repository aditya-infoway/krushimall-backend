import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import puppeteer from "puppeteer";
import { generateQuotationNo } from "../utils/generateQuotationNo.js";
import { generateCashReceiptVoucher } from "../utils/generateCashReceiptVoucher.js";
import { generateBankReceiptVoucher } from "../utils/generateBankReceiptVoucher.js";
import { getFileUrl } from "../utils/getFileUrl.js";

export const createLead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = user?.role?.toUpperCase();

    if (role === "BRANCH" && !user?.branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID missing from token — cannot create lead",
      });
    }

    // ==========================================
    // CALCULATE INITIAL QUOTATION GRAND TOTAL
    // Lead create hote waqt frontend sirf model/variant/colour
    // bhejta hai, price calculation nahi bhejta.
    // Isliye yaha ExShowroom + Insurance + RTO (tax ke saath)
    // nikal ke quotationGrandTotal me save karenge.
    // (Accessories yaha include nahi hote — wo sirf
    //  updateQuotation ke waqt add hote hain, kyunki
    //  accessories selection Lead create step me nahi hota)
    // ==========================================
    let initialQuotationGrandTotal = 0;

    if (req.body.showroomVariantId) {
      const showroomVariant = await prisma.showroomVariant.findUnique({
        where: {
          id: Number(req.body.showroomVariantId),
        },
      });

      if (showroomVariant) {
        const exShowroomTaxable = Number(showroomVariant.exShowroomPrice) || 0;
        const exShowroomTaxPercent =
          Number(showroomVariant.exShowroomTaxPercent) || 0;
        const exShowroomAmount =
          exShowroomTaxable + (exShowroomTaxable * exShowroomTaxPercent) / 100;

        const insuranceTaxable = Number(showroomVariant.insurance) || 0;
        const insuranceTaxPercent =
          Number(showroomVariant.insuranceTaxPercent) || 0;
        const insuranceAmount =
          insuranceTaxable + (insuranceTaxable * insuranceTaxPercent) / 100;

        const rtoTaxable = Number(showroomVariant.rtoCharge) || 0;
        const rtoTaxPercent = Number(showroomVariant.rtoTaxPercent) || 0;
        const rtoAmount = rtoTaxable + (rtoTaxable * rtoTaxPercent) / 100;

        initialQuotationGrandTotal =
          exShowroomAmount + insuranceAmount + rtoAmount;
      }
    }

    const data: any = {
      ...req.body,
      // ...existing transforms...
      quotationGrandTotal: initialQuotationGrandTotal,
      createdType: role,
      createdBy: req.body.createdBy || user?.employeeName || user?.name,
      branchId: role === "BRANCH" ? Number(user.branchId) : null,
      executiveId: req.body.executiveId ? Number(req.body.executiveId) : null,
      companyId: Number(req.body.companyId),
      financialYearId: Number(req.body.financialYearId),
      // ========================
      // FINANCE DETAILS
      // ========================

      financeDoneBy:
        req.body.purchaseType === "Finance"
          ? req.body.financeDoneBy || null
          : null,

      financeAmount:
        req.body.purchaseType === "Finance" &&
        req.body.financeAmount !== "" &&
        req.body.financeAmount !== null &&
        req.body.financeAmount !== undefined
          ? Number(req.body.financeAmount)
          : null,

      emi:
        req.body.purchaseType === "Finance" &&
        req.body.emi !== "" &&
        req.body.emi !== null &&
        req.body.emi !== undefined
          ? Number(req.body.emi)
          : null,

      tenureMonths:
        req.body.purchaseType === "Finance" &&
        req.body.tenureMonths !== "" &&
        req.body.tenureMonths !== null &&
        req.body.tenureMonths !== undefined
          ? Number(req.body.tenureMonths)
          : null,

      processingCharge:
        req.body.purchaseType === "Finance" &&
        req.body.processingCharge !== "" &&
        req.body.processingCharge !== null &&
        req.body.processingCharge !== undefined
          ? Number(req.body.processingCharge)
          : null,

      loanROI:
        req.body.purchaseType === "Finance" &&
        req.body.loanROI !== "" &&
        req.body.loanROI !== null &&
        req.body.loanROI !== undefined
          ? Number(req.body.loanROI)
          : null,

      marginMoney:
        req.body.purchaseType === "Finance" &&
        req.body.marginMoney !== "" &&
        req.body.marginMoney !== null &&
        req.body.marginMoney !== undefined
          ? Number(req.body.marginMoney)
          : null,
      showroomVariantId: req.body.showroomVariantId
        ? Number(req.body.showroomVariantId)
        : null,
      expectedPurchaseDate: req.body.expectedPurchaseDate
        ? new Date(req.body.expectedPurchaseDate)
        : null,

      expectedDeliveryDate: req.body.expectedDeliveryDate
        ? new Date(req.body.expectedDeliveryDate)
        : null,

      bookingDate: req.body.bookingDate ? new Date(req.body.bookingDate) : null,

      followUpDate: req.body.followUpDate
        ? new Date(req.body.followUpDate)
        : null,

      dmsEnquiryDate: req.body.dmsEnquiryDate
        ? new Date(req.body.dmsEnquiryDate)
        : null,
      customerExpectedPrice: req.body.customerExpectedPrice
        ? Number(req.body.customerExpectedPrice)
        : null,

      marketPrice: req.body.marketPrice ? Number(req.body.marketPrice) : null,

      chassisNo: req.body.chassisNo || null,

      companyShare: req.body.companyShare
        ? Number(req.body.companyShare)
        : null,

      dealerShares: req.body.dealerShares
        ? Number(req.body.dealerShares)
        : null,

      insurance: req.body.insurance ? Number(req.body.insurance) : null,

      vehicleNo: req.body.vehicleNo || null,

      accountId: req.body.customerId ? Number(req.body.customerId) : null,

      professionId: req.body.profession ? Number(req.body.profession) : null,

      enquiryTypeId: req.body.enquiryType ? Number(req.body.enquiryType) : null,

      enquirySourceId: req.body.enquirySource
        ? Number(req.body.enquirySource)
        : null,

      enquiryStatusId: req.body.enquiryStatus
        ? Number(req.body.enquiryStatus)
        : null,

      listOfBooking: req.body.listOfBooking
        ? Number(req.body.listOfBooking)
        : null,

      rcNo: req.body.rcNo || null,
      chequeDate: req.body.chequeDate ? new Date(req.body.chequeDate) : null,

      chequeClearDate: req.body.chequeClearDate
        ? new Date(req.body.chequeClearDate)
        : null,
    };

    // Change Current Vehicle checkbox OFF
    if (!req.body.wantsFinance) {
      data.existingCustomerModel = null;
      data.existingCustomerVariant = null;
      data.existingVehicleYear = null;
      data.customerExpectedPrice = null;
      data.marketPrice = null;
      data.chassisNo = null;
      data.companyShare = null;
      data.dealerShares = null;
      data.rcNo = null;
      data.insurance = null;
      data.vehicleNo = null;
    }
    delete data.profession;
    delete data.enquiryType;
    delete data.enquirySource;
    delete data.enquiryStatus;
    delete data.selectAccount;
    delete data.variantId; // add
    delete data.showroomVariant;
    delete data.exWarranty23;
    delete data.exWarranty28;
    console.log(data);
    const quotationNo = await generateQuotationNo();

    data.quotationNo = quotationNo;
    const lead = await prisma.lead.create({
      data,
    });
    if (
      req.body.advancePayment &&
      Number(req.body.listOfBooking) > 0 &&
      req.body.selectAccount
    ) {
      const amount = Number(req.body.listOfBooking);

      if (req.body.paymentMode === "CASH") {
        await prisma.cashReceipt.create({
          data: {
            voucherNo: await generateCashReceiptVoucher(),
            date: new Date(),
            companyId: Number(req.body.companyId),
            financialYearId: Number(req.body.financialYearId),

            cashAccountId: Number(req.body.selectAccount),
            oppAccountId: Number(req.body.customerId),

            leadId: lead.id,

            amount,
            narration: req.body.narration,

            type: "LCR", // ✅ Lead Cash Receipt

            createdType: (req as any).user?.role,
            createdBy: (req as any).user?.name,
          },
        });

        await prisma.account.update({
          where: {
            id: Number(req.body.selectAccount),
          },
          data: {
            closingBalance: {
              increment: amount,
            },
          },
        });
      }

      if (req.body.paymentMode === "BANK") {
        await prisma.bankReceipt.create({
          data: {
            voucherNo: await generateBankReceiptVoucher(),
            date: new Date(),

            companyId: Number(req.body.companyId),
            financialYearId: Number(req.body.financialYearId),

            bankAccountId: Number(req.body.selectAccount),
            oppAccountId: Number(req.body.customerId),

            leadId: lead.id,

            amount,

            paymentType: req.body.bankMode || "UPI",

            chequeNo: req.body.chequeNo || null,
            chequeDate: req.body.chequeDate
              ? new Date(req.body.chequeDate)
              : null,
            chequeClearDate: req.body.chequeClearDate
              ? new Date(req.body.chequeClearDate)
              : null,

            narration: req.body.narration,

            type: "LBR",

            createdType: (req as any).user?.role,
            createdBy: (req as any).user?.name,
          },
        });

        await prisma.account.update({
          where: {
            id: Number(req.body.selectAccount),
          },
          data: {
            closingBalance: {
              increment: amount,
            },
          },
        });
      }
    }
    return res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create lead",
      error,
    });
  }
};

export const getLeads = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const whereClause: any = {};
    if (user?.role?.toUpperCase() === "BRANCH") {
      whereClause.branchId = Number(user.branchId);
    }

    if (user?.role?.toUpperCase() === "SALES EXECUTIVE") {
      whereClause.executiveId = Number(user.id);
    }
    // Admin panel: no filter — sees everything (admin-created + all branches)

    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        customer: true,
        model: true,
        colour: true,
        executive: true,
        profession: true,
        enquiryTypeMaster: true,
        enquirySourceMaster: true,
        enquiryStatus: true,
        account: true,
  order: true,
        showroomVariant: {
          include: {
            accessories: {
              include: {
                accessory: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

  const data = await Promise.all(
  leads.map(async (lead) => {
    let leadTemperature = "Cold";
    let leadColor = "sky";

    if (lead.expectedPurchaseDate) {
      const expectedDate = new Date(lead.expectedPurchaseDate);
      expectedDate.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil(
        (expectedDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 7) {
        leadTemperature = "Hot";
        leadColor = "red";
      } else if (diffDays <= 15) {
        leadTemperature = "Warm";
        leadColor = "orange";
      }
    }

    const cashReceipts = await prisma.cashReceipt.aggregate({
      where: {
        leadId: lead.id,
      },
      _sum: {
        amount: true,
      },
    });

    const bankReceipts = await prisma.bankReceipt.aggregate({
      where: {
        leadId: lead.id,
      },
      _sum: {
        amount: true,
      },
    });

    const cashAmount = Number(cashReceipts._sum.amount || 0);
    const bankAmount = Number(bankReceipts._sum.amount || 0);

    const totalReceived = cashAmount + bankAmount;

    const quotationAmount = Number(lead.quotationGrandTotal || 0);

    const isBooked =
      quotationAmount > 0 &&
      totalReceived >= quotationAmount;

    return {
      ...lead,
      leadTemperature,
      leadColor,
      totalReceived,
      quotationAmount,
      leadStatus: isBooked ? "Booked" : leadTemperature,
    };
  })
);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET LEADS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
    });
  }
};
export const getLeadById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;

    const whereClause: any = {
      id,
    };

    if (user?.role === "BRANCH") {
      whereClause.branchId = Number(user.branchId);
    }
    if (user?.role?.toUpperCase() === "SALES EXECUTIVE") {
      whereClause.executiveId = Number(user.id);
    }
    // =========================
    // GET LEAD
    // =========================

    const lead = await prisma.lead.findFirst({
      where: whereClause,

      include: {
        customer: true,

        model: true,

        showroomVariant: {
          include: {
            accessories: {
              include: {
                accessory: true,
              },
            },
          },
        },

        colour: true,

        executive: true,
      },
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    // =========================
    // GET LATEST QUOTATION
    // =========================

    const latestQuotation = await prisma.quotationHistory.findFirst({
  where: {
    leadId: id,
  },
  orderBy: {
    revisionNo: "desc",
  },
});

return res.status(200).json({
  success: true,
  data: {
    ...lead,
    quotationGrandTotal:
      latestQuotation?.grandTotal ??
      lead.quotationGrandTotal ??
      0,

    selectedAccessories:
      latestQuotation?.selectedAccessories ?? [],
  },
});
  } catch (error) {
    console.error("GET LEAD BY ID ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch lead",

      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
export const generateOrderBillPdf = async (req: Request, res: Response) => {
  try {
    const leadId = Number(req.params.id);
    const company = await prisma.company.findFirst();
    const logoUrl = getFileUrl(company?.logo);

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        customer: true,
        model: true,
        showroomVariant: {
          include: {
            accessories: {
              include: {
                accessory: true,
              },
            },
          },
        },
        colour: true,
        executive: true,
        profession: true,
        enquiryTypeMaster: true,
        enquirySourceMaster: true,
        enquiryStatus: true,
        account: true,
      },
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    // Helper function to format currency
    const formatCurrency = (amount: number) => {
      return (
        amount?.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "0.00"
      );
    };
    const latestQuotationHistory = await prisma.quotationHistory.findFirst({
      where: {
        leadId,
      },

      orderBy: {
        revisionNo: "desc",
      },
    });
    // Calculate totals from lead data or use default values
    // EX-SHOWROOM

    const exShowroomTaxable =
      Number(lead.showroomVariant?.exShowroomPrice) || 0;

    const exShowroomTaxPercent =
      Number(lead.showroomVariant?.exShowroomTaxPercent) || 0;

    const exShowroomTaxAmount =
      (exShowroomTaxable * exShowroomTaxPercent) / 100;

    const exShowroomTotal = exShowroomTaxable + exShowroomTaxAmount;

    // INSURANCE

    const insuranceTaxable = Number(lead.showroomVariant?.insurance) || 0;

    const insuranceTaxPercent =
      Number(lead.showroomVariant?.insuranceTaxPercent) || 0;

    const insuranceTaxAmount = (insuranceTaxable * insuranceTaxPercent) / 100;

    const insuranceTotal = insuranceTaxable + insuranceTaxAmount;

    // RTO

    const rtoTaxable = Number(lead.showroomVariant?.rtoCharge) || 0;

    const rtoTaxPercent = Number(lead.showroomVariant?.rtoTaxPercent) || 0;

    const rtoTaxAmount = (rtoTaxable * rtoTaxPercent) / 100;

    const rtoTotal = rtoTaxable + rtoTaxAmount;

    // ACCESSORIES

    // ACCESSORIES

    // ====================================
    // ONLY TOGGLE-ON ACCESSORIES
    // ====================================

    const selectedAccessories = latestQuotationHistory
      ? Array.isArray(latestQuotationHistory.selectedAccessories)
        ? latestQuotationHistory.selectedAccessories
        : []
      : (lead.showroomVariant?.accessories || []).map((item) => ({
          id: item.id,

          accessoryId: item.accessoryId,

          name: item.accessory?.itemName || "Accessory",

          qty: Number(item.qty) || 1,

          price: Number(item.price) || 0,

          taxPercent: Number(item.taxPercent) || 0,

          totalPrice: Number(item.totalPrice) || 0,
        }));

    // Calculate only selected accessories
    const accessoriesTotal = selectedAccessories.reduce(
      (sum: number, item: any) => {
        return sum + (Number(item.totalPrice) || 0);
      },
      0,
    );

    // Generate rows only for selected accessories
    const accessoryRows = selectedAccessories
      .map((item: any) => {
        const accessoryName = item.name || "Accessory";

        const qty = Number(item.qty) || 1;

        const accessoryTotal = Number(item.totalPrice) || 0;

        return `
        <tr>
          <td>
            ${accessoryName}
            ${qty > 1 ? ` × ${qty}` : ""}
          </td>

          <td align="right">
            ${formatCurrency(accessoryTotal)}
          </td>
        </tr>
      `;
      })
      .join("");
    // FINAL TOTAL

    const total =
      exShowroomTotal + insuranceTotal + rtoTotal + accessoriesTotal;

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

    const totalInWords = numberToWords(Math.round(total));

    // Generate current date
    const currentDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Quotation / Programa Invoice</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
        body {
  font-family: Arial, sans-serif;
  background: #fff;
  margin: 0;
  padding: 0;
  font-size: 9px;
  color: #000;
  line-height: 1.2;
}
          
          /* Company Header - Red Theme */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border: 1px solid #000;
  padding: 5px;
  margin-bottom: 5px;
}

.company-left {
  width: 75%;
}

.company-right {
  width: 20%;
  text-align: center;
   margin-top: 10px;
}

.company-logo {
  max-width: 110px;
  max-height: 110px;
  object-fit: contain;
}

.company-name {
  font-size: 14px;
  font-weight: bold;
}

.company-details {
  font-size: 11px;
  line-height: 1.2;
  margin: 0;
}
          
          /* Title - Red Underline */
          .title {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            text-decoration: underline;
            text-underline-offset: 3px;
            text-decoration-color: #cc0000;
            margin: 12px 0 18px 0;
            letter-spacing: 1px;
            color: #000000;
            font-family: 'Times New Roman', serif;
          }
          
          /* Section Titles */
          .section-title {
            font-size: 12pt;
            font-weight: bold;
            margin: 12px 0 8px 0;
            border-bottom: 2px solid #cc0000;
            padding-bottom: 4px;
            color: #000000;
            font-family: 'Times New Roman', serif;
          }
          
          /* Customer Details - Grid Layout */
          .customer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1px 15px;
            margin-bottom: 12px;
            border: 1px solid #cccccc;
            padding: 10px 12px;
            background: #f9f9f9;
          }
          .customer-item {
            display: flex;
            padding: 3px 0;
            border-bottom: 1px dotted #e0e0e0;
          }
          .customer-item:nth-last-child(-n+2) {
            border-bottom: none;
          }
          .customer-label {
            font-weight: bold;
            min-width: 100px;
            color: #000000;
            font-family: 'Arial', sans-serif;
            font-size: 10pt;
          }
          .customer-value {
            color: #000000;
            font-family: 'Arial', sans-serif;
            font-size: 10pt;
          }
          
          /* Description Table - Clean Design */
          .table-container {
            margin: 10px 0;
            border: 1px solid #cccccc;
          }
            
          .table-header {
            display: grid;
            grid-template-columns: 1fr 130px;
            background: #1e2be0;
              color: white;
            font-weight: bold;
            padding: 6px 12px;
            border-bottom: 2px solid #000000;
            font-family: 'Arial', sans-serif;
            font-size: 10pt;
          }
          .table-row {
            display: grid;
            grid-template-columns: 1fr 130px;
            padding: 5px 12px;
            border-bottom: 1px solid #e8e8e8;
            font-family: 'Arial', sans-serif;
            font-size: 10pt;
          }
          .table-row:last-child {
            border-bottom: none;
          }
          .table-row .amount {
            text-align: right;
            font-family: 'Arial', sans-serif;
          }
          .table-total {
            display: grid;
            grid-template-columns: 1fr 130px;
            padding: 7px 12px;
            font-weight: bold;
            border-top: 2px solid #cc0000;
            background: #f8f8f8;
            font-family: 'Arial', sans-serif;
            font-size: 11pt;
          }
          .table-total .amount {
            text-align: right;
            color: #cc0000;
          }
          
          /* Payment Details */
          .payment-details {
            margin: 10px 0;
            padding: 10px 12px;
            border: 1px solid #cccccc;
            background: #f9f9f9;
          }
          .payment-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3px 15px;
          }
          .payment-item {
            display: flex;
            padding: 2px 0;
          }
          .payment-label {
            font-weight: bold;
            min-width: 110px;
            color: #000000;
            font-family: 'Arial', sans-serif;
            font-size: 10pt;
          }
          .payment-value {
            font-family: 'Arial', sans-serif;
            font-size: 10pt;
          }
          
          /* Amount in Words - Highlighted */
          .amount-in-words {
            margin: 10px 0;
            padding: 10px 12px;
            border: 1px solid #cc0000;
            background: #fff5f5;
            font-size: 11pt;
            font-family: 'Times New Roman', serif;
          }
          .amount-in-words strong {
            color: #cc0000;
            font-weight: bold;
          }
          
          /* Enquiry Type */
          .enquiry-type {
            margin: 8px 0;
            padding: 6px 12px;
            border: 1px solid #cccccc;
            background: #f9f9f9;
            font-family: 'Arial', sans-serif;
            font-size: 10pt;
          }
          .enquiry-type strong {
            color: #000000;
          }
          
        .quotation-terms {
  padding: 8px 12px !important;
  vertical-align: top;
  font-size: 10px;
  line-height: 1.4;
  font-weight: normal;
  overflow-wrap: break-word;
  word-break: normal;
}

.quotation-terms ol {
  margin: 0;
  padding-left: 20px;
  list-style-position: outside;
}

.quotation-terms ul {
  margin: 0;
  padding-left: 20px;
  list-style-position: outside;
}

.quotation-terms li {
  margin: 2px 0;
  padding-left: 2px;
  font-weight: normal;
}

.quotation-terms li p {
  display: inline;
  margin: 0;
  padding: 0;
}

.quotation-terms p {
  margin: 2px 0;
  font-weight: normal;
}

.quotation-terms strong {
  font-weight: bold;
}

.quotation-terms em {
  font-style: italic;
}

.quotation-terms u {
  text-decoration: underline;
}
          /* Signatures */
          .signature-section {
            margin-top: 25px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
          }
          .signature-box {
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #000000;
            padding-top: 6px;
            margin-top: 35px;
            font-size: 10pt;
            color: #333333;
            font-family: 'Arial', sans-serif;
          }
          .main-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
}

.main-table td {
  border: 1px solid #000;
  padding: 4px 6px;
  font-size: 13px;
}

.blue-header {
  background: #003399;
  color: #fff;
  font-weight: bold;
  text-align: left;
}
  .payment-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  margin-bottom: 10px;
}

.payment-table td {
  border: 1px solid #000;
  padding: 6px 8px;
  font-size: 13px;
}

.payment-header {
  background: #003399;
  color: white;
  font-weight: bold;
  text-align: left;
  font-size: 15px;
}

.payment-label {
  width: 35%;
  font-weight: bold;
  background: #f8f8f8;
}
          /* Footer */
          .footer {
            margin-top: 16px;
            text-align: center;
            font-size: 9pt;
            color: #666666;
            
            padding-top: 8px;
            font-family: 'Arial', sans-serif;
          }
          
          @media print {
            body { padding: 20px 30px; }
            .company-name { color: #cc0000; }
            .table-total .amount { color: #cc0000; }
            .amount-in-words { border-color: #cc0000; background: #fff5f5; }
          }
        </style>
      </head>
      <body>
        <!-- Company Header -->
        <div class="title">QUOTATION / PROGRAMA INVOICE</div>
        <div class="header-section">

  <div class="company-left">
    <div class="company-name">
      ${company?.companyName || ""}
    </div>

    <div class="company-details">
      ${company?.addressLine1 || ""}
      ${company?.addressLine2 || ""}
    </div>

    <div class="company-details">
      ${company?.city || ""}, ${company?.state || ""}
      - ${company?.pincode || ""}
    </div>

    <div class="company-details">
      Mob: ${company?.mobileNumber || ""}
    </div>

    <div class="company-details">
      Email: ${company?.email || ""}
    </div>

    <div class="company-details">
      GST: ${company?.gstNumber || ""}
    </div>
  </div>

 <div class="company-right">
  ${logoUrl ? `<img src="${logoUrl}" class="company-logo" />` : ""}
</div>

</div>
        </div>

        <!-- Title -->
       

        <!-- Customer Details -->
       <table class="main-table">
  <tr>
    <td colspan="4" class="blue-header">
      CUSTOMER DETAILS
    </td>
  </tr>

  <tr>
    <td><b>Quotation No</b></td>
   <td>
  ${
    Number(lead.quotationRevision) > 0
      ? `${lead.quotationNo}/R${lead.quotationRevision}`
      : lead.quotationNo || ""
  }
</td>
    <td><b>Name</b></td>
    <td>${lead.customer?.accountName || "Danish pastel"}</td>
  </tr>

  <tr>
    <td><b>Address</b></td>
    <td colspan="3">${lead.customer?.address1 || "Jalgaon"}</td>
  </tr>

  <tr>
    <td><b>City</b></td>
    <td>${lead.customer?.city || "Aheri"}</td>
    <td><b>Taluka</b></td>
    <td>${lead.customer?.taluka || "-"}</td>
  </tr>

  <tr>
    <td><b>District</b></td>
    <td>${lead.customer?.district || "-"}</td>
    <td><b>State</b></td>
    <td>${lead.customer?.state || "Maharashtra"}</td>
  </tr>

  <tr>
    <td><b>Mobile</b></td>
    <td>${lead.customer?.mobile || ""}</td>
    <td><b>Model</b></td>
    <td>${lead.model?.modelName || "C12"}</td>
  </tr>

  <tr>
    <td><b>Variant</b></td>
    <td>${lead.showroomVariant?.variantName || "EX"}</td>
    <td><b>Colour</b></td>
    <td>${lead.colour?.colourName || "RED"}</td>
  </tr>

  <tr>
    <td><b>Sales Executive</b></td>
    <td>${lead.executive?.employeeName || "Kashyap"}</td>
    <td><b>Position</b></td>
    <td>${lead.executive?.role || "Team Leader"}</td>
  </tr>
</table>

     <table class="main-table">
  <tr>
    <td class="blue-header">DESCRIPTION</td>
    <td class="blue-header" style="text-align:right;">
      AMOUNT
    </td>
  </tr>
<tr>
  <td>EX-showroom price</td>
  <td align="right">${formatCurrency(exShowroomTotal)}</td>
</tr>

<tr>
  <td>Insurance</td>
  <td align="right">${formatCurrency(insuranceTotal)}</td>
</tr>

<tr>
  <td>RTO Charge</td>
  <td align="right">${formatCurrency(rtoTotal)}</td>
</tr>
  ${accessoryRows}
  <tr>
    <td><b>Total</b></td>
    <td align="right">
      <b>${formatCurrency(total)}</b>
    </td>
  </tr>
</table>

        <!-- Payment Details -->
<table class="payment-table">
  <tr>
    <td colspan="2" class="payment-header">
      PAYMENT DETAILS
    </td>
  </tr>

  <tr>
    <td class="payment-label">Account Holder</td>
    <td>${company?.bankHolderName || ""}</td>
  </tr>

  <tr>
    <td class="payment-label">Bank</td>
     <td>${company?.bankName || ""}</td>
  </tr>

  <tr>
    <td class="payment-label">Account Number</td>
    <td>${company?.accountNumber || ""}</td>
  </tr>

  <tr>
    <td class="payment-label">IFSC</td>
  <td>${company?.ifscCode || ""}</td>
  </tr>
</table>
        <!-- Payable Amount in Words -->
        <div class="amount-in-words">
          <strong>Payable Amount:</strong> ${totalInWords}
        </div>

        <!-- Enquiry Type -->
   <table class="main-table">
  <tr>
    <td width="50%">
      <b>Enquiry Type:</b>
      ${lead.enquiryTypeMaster?.enquiryType || "Corporate"}
    </td>
    <td width="50%">
      <b>Enquiry Source:</b>
      ${lead.enquirySourceMaster?.enquirySource || "Instagram"}
    </td>
  </tr>

  <tr>
    <td colspan="2">
      <b>Terms & Conditions:</b>
    </td>
  </tr>

  <tr>
   <td
    colspan="2"
    class="quotation-terms"
  >
    ${
      company?.quotationTerms ||
      "<p>No quotation terms and conditions added.</p>"
    }
  </td>
  </tr>
</table>

        <!-- Signatures -->
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line">Authorized Signature</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Customer Signature</div>
          </div>
        </div>

        <!-- Footer -->
      
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
await page.evaluate(async () => {
  const images = Array.from(document.images);
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener("load", resolve);
        img.addEventListener("error", resolve); // don't hang forever on broken image
      });
    })
  );
});
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0",
        bottom: "0",
        left: "0",
        right: "0",
      },
      displayHeaderFooter: false,
      preferCSSPageSize: false,
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=quotation-${leadId}-${Date.now()}.pdf`,
    );
    res.setHeader("Content-Length", pdf.length);

    res.end(pdf);
  } catch (error) {
    console.error("PDF Generation Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
// <div class="footer">
//   Generated on: ${currentDate} | Thank you for your business!
// </div>
//       <tr>
//   <td>Road Side Assistance</td>
//   <td align="right">${formatCurrency(roadSideAssistance)}</td>
// </tr>
//  <tr>
//   <td>Ex. Warranty (2+3)</td>
//   <td align="right">${formatCurrency(exWarranty23)}</td>
// </tr>

// <tr>
//   <td>Hypothecation Charges</td>
//   <td align="right">${formatCurrency(hypothecationCharges)}</td>
// </tr>

// <tr>
//   <td>Ex. Warranty (2+8)</td>
//   <td align="right">${formatCurrency(exWarranty28)}</td>
// </tr>

// <tr>
//   <td>RTO Registration Charges</td>
//   <td align="right">${formatCurrency(rtoRegistrationCharges)}</td>
// </tr>
export const updateQuotation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const leadId = Number(req.params.id);

    const {
      modelId,
      showroomVariantId,
      colourId,
      selectedAccessories = [],
    } = req.body;

    if (!leadId || !modelId || !showroomVariantId || !colourId) {
      res.status(400).json({
        success: false,
        message: "Model, showroom variant and colour are required",
      });
      return;
    }

    // Get existing lead
    const existingLead = await prisma.lead.findUnique({
      where: {
        id: leadId,
      },
    });

    if (!existingLead) {
      res.status(404).json({
        success: false,
        message: "Lead not found",
      });
      return;
    }

    // Get selected showroom variant
    const selectedShowroomVariant = await prisma.showroomVariant.findUnique({
      where: {
        id: Number(showroomVariantId),
      },
    });

    if (!selectedShowroomVariant) {
      res.status(404).json({
        success: false,
        message: "Showroom variant not found",
      });
      return;
    }

    // R1 → R2 → R3
    const nextRevision = (existingLead.quotationRevision || 0) + 1;

    // =========================
    // EX-SHOWROOM WITH TAX
    // =========================

    const exShowroomTaxable =
      Number(selectedShowroomVariant.exShowroomPrice) || 0;

    const exShowroomTaxPercent =
      Number(selectedShowroomVariant.exShowroomTaxPercent) || 0;

    const exShowroomAmount =
      exShowroomTaxable + (exShowroomTaxable * exShowroomTaxPercent) / 100;

    // =========================
    // INSURANCE WITH TAX
    // =========================

    const insuranceTaxable = Number(selectedShowroomVariant.insurance) || 0;

    const insuranceTaxPercent =
      Number(selectedShowroomVariant.insuranceTaxPercent) || 0;

    const insuranceAmount =
      insuranceTaxable + (insuranceTaxable * insuranceTaxPercent) / 100;

    // =========================
    // RTO WITH TAX
    // =========================

    const rtoTaxable = Number(selectedShowroomVariant.rtoCharge) || 0;

    const rtoTaxPercent = Number(selectedShowroomVariant.rtoTaxPercent) || 0;

    const rtoAmount = rtoTaxable + (rtoTaxable * rtoTaxPercent) / 100;

    // =========================
    // ONLY TOGGLE-ON ACCESSORIES
    // =========================

    const accessoriesAmount = selectedAccessories.reduce(
      (sum: number, item: any) => {
        return sum + (Number(item.totalPrice) || 0);
      },
      0,
    );

    // =========================
    // GRAND TOTAL
    // =========================

    const grandTotal =
      exShowroomAmount + insuranceAmount + rtoAmount + accessoriesAmount;

    // Update Lead + save history together
    const result = await prisma.$transaction(async (tx) => {
      // Update current quotation values
      const updatedLead = await tx.lead.update({
        where: {
          id: leadId,
        },

        data: {
          modelId: Number(modelId),

          showroomVariantId: Number(showroomVariantId),

          colourId: Number(colourId),

          quotationRevision: nextRevision,
        },

        include: {
          customer: true,
          model: true,
          colour: true,

          showroomVariant: {
            include: {
              accessories: {
                include: {
                  accessory: true,
                },
              },
            },
          },
        },
      });

      // Save R1/R2/R3 history
      const history = await tx.quotationHistory.create({
        data: {
          leadId,

          quotationNo: existingLead.quotationNo || "",

          revisionNo: nextRevision,

          modelId: Number(modelId),

          showroomVariantId: Number(showroomVariantId),

          colourId: Number(colourId),

          exShowroomAmount,

          insuranceAmount,

          rtoAmount,

          accessoriesAmount,

          grandTotal,

          // Only ON accessories
          selectedAccessories,

          updatedBy:
            req.body.createdBy ||
            (req as any).user?.employeeName ||
            (req as any).user?.name ||
            null,
        },
      });

      return {
        updatedLead,
        history,
      };
    });

    res.status(200).json({
      success: true,

      message: `Quotation updated successfully to R${nextRevision}`,

      quotationDisplayNo: `${existingLead.quotationNo}/R${nextRevision}`,

      data: result.updatedLead,

      history: result.history,
    });
  } catch (error) {
    console.error("UPDATE QUOTATION ERROR:", error);

    res.status(500).json({
      success: false,

      message: "Failed to update quotation",

      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
// leadController.ts

export const getQuotationHistoryList = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const whereClause: any = {
      // Show only leads where quotation was revised
      quotationRevision: {
        gt: 0,
      },
    };

    // Branch user can see only own branch leads
    if (user?.role?.toUpperCase() === "BRANCH") {
      whereClause.branchId = Number(user.branchId);
    }
    if (user?.role?.toUpperCase() === "SALES EXECUTIVE") {
      whereClause.executiveId = Number(user.id);
    }
    const leads = await prisma.lead.findMany({
      where: whereClause,

      select: {
        id: true,
        quotationNo: true,
        quotationRevision: true,
        updatedAt: true,

        customer: {
          select: {
            accountName: true,
            mobile: true,
          },
        },

        _count: {
          select: {
            quotationHistories: true,
          },
        },
      },

      orderBy: {
        updatedAt: "desc",
      },
    });

    const data = leads.map((lead) => ({
      id: lead.id,

      customerName: lead.customer?.accountName || "-",

      mobile: lead.customer?.mobile || "-",

      quotationNo: lead.quotationNo || "-",

      // Actual saved quotation-history records
      revisionCount: lead._count.quotationHistories,

      updatedAt: lead.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET QUOTATION HISTORY LIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch quotation history",
    });
  }
};
// controllers/lead.ts

export const getQuotationHistoryByLeadId = async (
  req: Request,
  res: Response,
) => {
  try {
    const leadId = Number(req.params.id);

    if (!leadId || Number.isNaN(leadId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID",
      });
    }

    const lead = await prisma.lead.findUnique({
      where: {
        id: leadId,
      },

      select: {
        id: true,
        quotationNo: true,
        quotationRevision: true,

        createdAt: true,
        updatedAt: true,
        createdBy: true,

        // Original quotation model
        model: {
          select: {
            modelName: true,
          },
        },

        // Original quotation variant
        showroomVariant: {
          select: {
            variantName: true,
          },
        },

        // Original quotation colour
        colour: {
          select: {
            colourName: true,
          },
        },

        customer: {
          select: {
            accountName: true,
            mobile: true,
            city: true,
          },
        },

        // Updated quotation records
        quotationHistories: {
          orderBy: {
            revisionNo: "asc",
          },

          select: {
            id: true,
            revisionNo: true,
            quotationNo: true,

            // Already saved quotation total
            grandTotal: true,

            updatedBy: true,
            createdAt: true,

            model: {
              select: {
                modelName: true,
              },
            },

            showroomVariant: {
              select: {
                variantName: true,
              },
            },

            colour: {
              select: {
                colourName: true,
              },
            },
          },
        },
      },
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    const history = [
      // =========================
      // ORIGINAL QUOTATION
      // =========================

      {
        id: `original-${lead.id}`,

        leadId: lead.id,

        revisionNo: 0,

        revisionName: "Original Quotation",

        quotationNo: lead.quotationNo || "-",

        modelName: lead.model?.modelName || "-",

        variantName: lead.showroomVariant?.variantName || "-",

        colourName: lead.colour?.colourName || "-",

        /*
         Original total is not currently
         saved in your Lead table.

         Therefore don't recalculate it.
        */
        totalAmount: null,

        createdBy: lead.createdBy || "-",

        createdAt: lead.createdAt,

        isOriginal: true,
      },

      // =========================
      // UPDATED QUOTATIONS
      // =========================

      ...lead.quotationHistories.map((item) => ({
        id: item.id,

        leadId: lead.id,

        revisionNo: item.revisionNo,

        revisionName: `Revision ${item.revisionNo}`,

        quotationNo: lead.quotationNo
          ? `${lead.quotationNo}-R${item.revisionNo}`
          : "-",

        modelName: item.model?.modelName || "-",

        variantName: item.showroomVariant?.variantName || "-",

        colourName: item.colour?.colourName || "-",

        // Direct saved value — no calculation
        totalAmount: Number(item.grandTotal) || 0,

        createdBy: item.updatedBy || "-",

        createdAt: item.createdAt,

        isOriginal: false,
      })),
    ];

    return res.status(200).json({
      success: true,

      customer: {
        customerName: lead.customer?.accountName || "-",

        mobile: lead.customer?.mobile || "-",

        city: lead.customer?.city || "-",
      },

      data: history,
    });
  } catch (error) {
    console.error("GET QUOTATION HISTORY DETAILS ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch quotation history details",

      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
export const getBookingBalance = async (req: Request, res: Response) => {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        customer: {
          select: {
            accountName: true,
            mobile: true,
          },
        },

        model: {
          select: {
            modelName: true,
          },
        },

        showroomVariant: {
          select: {
            variantName: true,
          },
        },

        colour: {
          select: {
            colourName: true,
          },
        },

        cashReceipts: {
          select: {
            amount: true,
          },
        },

        bankReceipts: {
          select: {
            amount: true,
          },
        },

        // NEW: latest quotation revision, agar hai to
        quotationHistories: {
          orderBy: {
            revisionNo: "desc",
          },
          take: 1,
          select: {
            grandTotal: true,
          },
        },

        order: {
          select: {
            invoiceAmount: true,
            total: true,
            receivedAmount: true,
            pendingAmount: true,
            chassisNo: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const bookingBalance = leads.map((lead, index) => {
      // ==========================================
      // 1) INVOICE AMOUNT
      // Order bana hai -> Order.invoiceAmount
      // Order nahi bana -> latest quotation grandTotal
      //    -> agar wo bhi nahi to Lead.quotationGrandTotal (initial value)
      // ==========================================
      const invoiceAmount = lead.order
        ? Number(lead.order.invoiceAmount || 0)
        : Number(
            lead.quotationHistories?.[0]?.grandTotal ??
              lead.quotationGrandTotal ??
              0,
          );

      // ==========================================
      // 2) RECEIVED AMOUNT
      // Order bana hai -> Order.receivedAmount (exchange discount + margin payment)
      // Order nahi bana -> sirf jo advance payment (cash/bank receipts) leadId se linked hai uska total
      // ==========================================
      const advancePaid =
        lead.cashReceipts.reduce((sum, r) => sum + Number(r.amount || 0), 0) +
        lead.bankReceipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);

      const receivedAmount = advancePaid;

      // Hamesha invoiceAmount - receivedAmount (never negative)
      const pendingAmount = Math.max(invoiceAmount - receivedAmount, 0);

      const age = Math.floor(
        (Date.now() - new Date(lead.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return {
        sr: index + 1,

        leadDate: lead.createdAt,

        leadId: lead.id,

        dmsEnquiryNo: lead.dmsEnquiryNo,

        dmsEnquiryDate: lead.dmsEnquiryDate,

        customerName: lead.customer?.accountName || "-",

        contact: lead.customer?.mobile || "-",

        model: lead.model?.modelName || "-",

        variant: lead.showroomVariant?.variantName || "-",

        colour: lead.colour?.colourName || "-",

        ageLead: `${age} Days`,

        invoiceAmount,

        receivedAmount,

        pendingAmount,

        // Order bana hai to hi chassis suggest hoga
        suggestChassisNo: lead.order?.chassisNo || "-",

        paymentHistory:
          lead.cashReceipts.length + lead.bankReceipts.length > 0
            ? "View"
            : "-",
      };
    });

    // ==========================================
    // REMOVE FULLY SETTLED ENTRIES
    // Jab invoiceAmount > 0 AND receivedAmount === invoiceAmount
    // AND pendingAmount === 0 -> lead ka pura paisa aa chuka hai,
    // isliye Booking Balance list se hata do.
    // (invoiceAmount === 0 wale fresh leads list mein rahenge)
    // ==========================================
    const pendingBookingBalance = bookingBalance.filter((row) => {
      const isFullySettled =
        row.receivedAmount === row.invoiceAmount && row.pendingAmount === 0;

      return !isFullySettled;
    });

    const summary = {
      invoiceAmount: pendingBookingBalance.reduce(
        (sum, row) => sum + row.invoiceAmount,
        0,
      ),

      receivedAmount: pendingBookingBalance.reduce(
        (sum, row) => sum + row.receivedAmount,
        0,
      ),

      pendingAmount: pendingBookingBalance.reduce(
        (sum, row) => sum + row.pendingAmount,
        0,
      ),
    };

    const modelMap = new Map();

    pendingBookingBalance.forEach((row) => {
      if (!modelMap.has(row.model)) {
        modelMap.set(row.model, {
          model: row.model,
          totalLead: 0,
          bookedLead: 0,
        });
      }

      const model = modelMap.get(row.model);

      model.totalLead++;

      // "Booked" ab order create hone par count hoga
      if (row.invoiceAmount > 0 && row.receivedAmount > 0) {
        model.bookedLead++;
      }
    });

    return res.json({
      success: true,

      data: {
        summary,

        modelAnalysis: Array.from(modelMap.values()),

        rows: pendingBookingBalance,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch booking balance",
    });
  }
};
export const getLeadsForCashReceipt = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const whereClause: any = {};
    if (user?.role?.toUpperCase() === "BRANCH") {
      whereClause.branchId = Number(user.branchId);
    }
    if (user?.role?.toUpperCase() === "SALES EXECUTIVE") {
      whereClause.executiveId = Number(user.id);
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        customer: true,
        cashReceipts: { select: { amount: true } },
        bankReceipts: { select: { amount: true } },
        quotationHistories: {
          orderBy: { revisionNo: "desc" },
          take: 1,
          select: { grandTotal: true },
        },
        order: {
          select: { invoiceAmount: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ==========================================
    // SIRF WOH LEADS JINME ABHI PAYMENT PENDING HAI
    // invoiceAmount - receivedAmount > 0
    // ==========================================
    const pendingLeads = leads.filter((lead) => {
      const invoiceAmount = lead.order
        ? Number(lead.order.invoiceAmount || 0)
        : Number(
            lead.quotationHistories?.[0]?.grandTotal ??
              lead.quotationGrandTotal ??
              0,
          );

      const receivedAmount =
        lead.cashReceipts.reduce((sum, r) => sum + Number(r.amount || 0), 0) +
        lead.bankReceipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);

      const pendingAmount = invoiceAmount - receivedAmount;

      return pendingAmount > 0;
    });

    return res.json({
      success: true,
      data: pendingLeads,
    });
  } catch (error) {
    console.error("GET LEADS FOR CASH RECEIPT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
    });
  }
};