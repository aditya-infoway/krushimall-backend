import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import puppeteer from "puppeteer";
import { generateQuotationNo } from "../utils/generateQuotationNo.js";
export const createLead = async (req: Request, res: Response) => {
  try {
    const data: any = {
      ...req.body,
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

      exchangeBonus: req.body.exchangeBonus
        ? Number(req.body.exchangeBonus)
        : null,

      smiplShares: req.body.smiplShares ? Number(req.body.smiplShares) : null,

      dealerShares: req.body.dealerShares
        ? Number(req.body.dealerShares)
        : null,

      insurance: req.body.insurance ? Number(req.body.insurance) : null,

      totalValue: req.body.totalValue ? Number(req.body.totalValue) : null,

      accountId: req.body.selectAccount ? Number(req.body.selectAccount) : null,

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

      valueAddAccessories: req.body.valueAddAccessories
        ? Number(req.body.valueAddAccessories)
        : null,
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
      data.exchangeBonus = null;
      data.smiplShares = null;
      data.dealerShares = null;
      data.valueAddAccessories = null;
      data.insurance = null;
      data.totalValue = null;
    }
    delete data.profession;
    delete data.enquiryType;
    delete data.enquirySource;
    delete data.enquiryStatus;
    delete data.selectAccount;
delete data.variantId;       // add
delete data.showroomVariant;
    delete data.exWarranty23;
    delete data.exWarranty28;
    console.log(data);
    const quotationNo = await generateQuotationNo();

data.quotationNo = quotationNo;
    const lead = await prisma.lead.create({
      data,
    });

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
    
    const leads = await prisma.lead.findMany({
      include: {
        customer: true,
        model: true,
        showroomVariant: true,
        colour: true,
        executive: true,
        profession: true,
        enquiryTypeMaster: true,
        enquirySourceMaster: true,
        enquiryStatus: true,
        account: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: leads,
    });
  } catch (error) {
       console.error("GET LEADS ERROR:", error); 
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
    });
  }
};
export const getLeadById = async (
  req: Request,
  res: Response
) => {
  const id = Number(req.params.id);

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      customer: true,
      model: true,
        showroomVariant: true,
      colour: true,
      executive: true,
    },
  });

  return res.json({
    success: true,
    data: lead,
  });
};
export const generateOrderBillPdf = async (req: Request, res: Response) => {
  try {
    const leadId = Number(req.params.id);
const company = await prisma.company.findFirst();

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        customer: true,
        model: true,
      showroomVariant: true,
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

    // Calculate totals from lead data or use default values
  const exShowroomPrice =
  lead.showroomVariant?.exShowroomPrice ?? 0;

const insurance =
  lead.showroomVariant?.insurance ?? 0;

const rtoCharge =
  lead.showroomVariant?.rtoCharge ?? 0;

 const total =
  exShowroomPrice +
  insurance +
  rtoCharge;

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

      const convertHundreds = (n: number) => {
        if (n < 20) return ones[n];
        if (n < 100)
          return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
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
          
          /* Terms & Conditions */
          .terms {
            margin: 10px 0;
            padding: 10px 12px;
            border: 1px solid #cccccc;
            background: #f9f9f9;
            font-size: 9pt;
            font-family: 'Arial', sans-serif;
          }
          .terms strong {
            color: #000000;
            font-size: 10pt;
          }
          .terms ul {
            margin-left: 18px;
            margin-top: 3px;
            list-style-type: disc;
          }
          .terms li {
            margin: 1px 0;
            color: #333333;
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
    ${
      company?.logo
        ? `<img src="http://localhost:5000/uploads/${company.logo}" class="company-logo" />`
        : ""
    }
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
    <td>${lead.quotationNo || ""}</td>
    <td><b>Name</b></td>
    <td>${lead.customer?.accountName || "Danish pastel"}</td>
  </tr>

  <tr>
    <td><b>Address</b></td>
    <td colspan="3">${lead.customer?.address || "Jalgaon"}</td>
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
    <td>${lead.customer?.mobileNumber || lead.customer?.mobile || ""}</td>
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
  <td align="right">${formatCurrency(exShowroomPrice)}</td>
</tr>

<tr>
  <td>Insurance</td>
  <td align="right">${formatCurrency(insurance)}</td>
</tr>

<tr>
  <td>RTO Charge</td>
  <td align="right">${formatCurrency(rtoCharge)}</td>
</tr>

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
    <td>${lead.account?.accountHolder || ""}</td>
  </tr>

  <tr>
    <td class="payment-label">Bank</td>
    <td>${lead.account?.bankName || ""}</td>
  </tr>

  <tr>
    <td class="payment-label">Account Number</td>
    <td>${lead.account?.accountNumber || ""}</td>
  </tr>

  <tr>
    <td class="payment-label">IFSC</td>
    <td>${lead.account?.ifscCode || ""}</td>
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
    <td colspan="2" style="height:40px; vertical-align:top;">
      1. This is a system generated quotation/invoice.<br>
      2. Subject to Jalgaon jurisdiction.<br>
      3. All disputes subject to Jalgaon court only.<br>
      4. Goods once sold will not be taken back.<br>
      5. Interest @ 18% p.a. will be charged on delayed payments.
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
      waitUntil: "networkidle0",
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