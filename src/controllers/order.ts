import { Request, Response } from "express";

import prisma from "../lib/prisma.js";
import { generateCashReceiptVoucher } from "../utils/generateCashReceiptVoucher.js";
import { getFileUrl } from "../utils/getFileUrl.js";
import { generateBankReceiptVoucher } from "../utils/generateBankReceiptVoucher.js";
// ==========================================
// HELPER FUNCTIONS
// ==========================================
import { generateDeliveryChallanHtml } from "../utils/generateDeliveryChallanHtml.js";
import { generateAccessoriesInvoiceNo } from "../utils/generateAccessoriesInvoiceNo.js";
const toNumber = (value: unknown): number => {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
};

const toOptionalInt = (value: unknown): number | null => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);

  return Number.isInteger(numberValue) ? numberValue : null;
};

const toOptionalDate = (value: unknown): Date | null => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const date = new Date(String(value));

  return Number.isNaN(date.getTime()) ? null : date;
};

// ==========================================
// CREATE ORDER
// POST /api/orders
// ==========================================

export const createOrder = async (req: Request, res: Response) => {
  try {
    // Logged-in user details
    const user = (req as any).user;

    const role = user?.role?.toUpperCase() || "ADMIN";

    const name = user?.employeeName || user?.name || "Admin";

    const userId = Number(user?.id) || null;
    const {
      companyId,
      financialYearId,
      leadId,

      vehicleCharges = {},
      allotment = {},
      hypothecation = {},
      exchange = {},
      payment = {},
      broker = {},
      delivery = {},
      selectedAccessories = [],
    } = req.body;

    // ======================================
    // BASIC VALIDATION
    // ======================================

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    if (!financialYearId) {
      return res.status(400).json({
        success: false,
        message: "Financial year ID is required",
      });
    }

    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: "Lead ID is required",
      });
    }

    if (!allotment.chassisNo) {
      return res.status(400).json({
        success: false,
        message: "Please select chassis number",
      });
    }

    // ======================================
    // CHECK COMPANY
    // ======================================

    const company = await prisma.company.findUnique({
      where: {
        id: Number(companyId),
      },
      select: {
        id: true,
      },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // ======================================
    // CHECK FINANCIAL YEAR
    // ======================================

    const financialYear = await prisma.financialYear.findUnique({
      where: {
        id: Number(financialYearId),
      },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (!financialYear) {
      return res.status(404).json({
        success: false,
        message: "Financial year not found",
      });
    }

    if (financialYear.companyId !== Number(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Financial year does not belong to selected company",
      });
    }

    // ======================================
    // CHECK LEAD
    // ======================================

    const lead = await prisma.lead.findUnique({
      where: {
        id: Number(leadId),
      },
      select: {
        id: true,
        accountId: true,
      },
    });

    // Check whether Lead exists
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    // Check whether Customer Account is selected
    const customerAccountId = lead?.accountId ? Number(lead.accountId) : null;

    // ======================================
    // ONE ORDER PER LEAD
    // ======================================

    const existingOrder = await prisma.order.findUnique({
      where: {
        leadId: Number(leadId),
      },
    });

    if (existingOrder) {
      return res.status(409).json({
        success: false,
        message: "Order already created for this lead",
      });
    }

    // ======================================
    // MARGIN PAYMENT VALIDATION
    // ======================================

    const marginMoney = toNumber(hypothecation.marginMoney);

    const cashAmount = toNumber(hypothecation.cashAmount);

    const bankAmount = toNumber(hypothecation.bankAmount);

    if (
      hypothecation.paymentStatus === "received" &&
      cashAmount + bankAmount !== marginMoney
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cash amount and bank amount total must be equal to margin amount",
      });
    }

    if (cashAmount > 0 && !hypothecation.cashAccountId) {
      return res.status(400).json({
        success: false,
        message: "Please select cash account",
      });
    }

    if (bankAmount > 0 && !hypothecation.bankAccountId) {
      return res.status(400).json({
        success: false,
        message: "Please select bank account",
      });
    }

    if (bankAmount > 0 && !hypothecation.paymentMode) {
      return res.status(400).json({
        success: false,
        message: "Please select bank payment mode",
      });
    }

    if (
      bankAmount > 0 &&
      hypothecation.paymentMode === "CHEQUE" &&
      !hypothecation.chequeNo
    ) {
      return res.status(400).json({
        success: false,
        message: "Cheque number is required",
      });
    }

    // ======================================
    // CREATE ORDER
    // ======================================

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          companyId: Number(companyId),

          financialYearId: Number(financialYearId),

          leadId: Number(leadId),

          // =================================
          // VEHICLE CHARGES
          // =================================

          exShowroomPrice: toNumber(vehicleCharges.exShowroomPrice),

          insurance: toNumber(vehicleCharges.insurance),

          roadSideAssistance: toNumber(vehicleCharges.roadSideAssistance),

          exWarranty2_3: toNumber(vehicleCharges.exWarranty2_3),

          hypothecationCharges: toNumber(vehicleCharges.hypothecationCharges),

          exWarranty2_8: toNumber(vehicleCharges.exWarranty2_8),

          rtoRegistrationCharge: toNumber(
            vehicleCharges.rtoRegistrationCharge ??
              vehicleCharges.rtoRegistrationCharges,
          ),

          rtoOtherCharge: toNumber(vehicleCharges.rtoOtherCharge),

          // =================================
          // ALLOTMENT DETAILS
          // =================================

          model: allotment.model || null,

          variant: allotment.variant || null,

          colour: allotment.colour ?? allotment.color ?? null,

          chassisNo: allotment.chassisNo || null,

          policyNo: allotment.policyNo || null,

          nomineeName: allotment.nomineeName || null,

          nomineeDob: toOptionalDate(allotment.nomineeDob),

          relationWithNominee: allotment.relationWithNominee || null,

          // =================================
          // HYPOTHECATION DETAILS
          // =================================

          hypothecationType: hypothecation.type || null,

          financeDoneBy: toOptionalInt(hypothecation.financeDoneBy),

          bankOfFinance: hypothecation.bankOfFinance || null,

          financeAmount: toNumber(hypothecation.financeAmount),

          emi: toNumber(hypothecation.emi),

          tenureMonths: Math.trunc(toNumber(hypothecation.tenureMonths)),

          processingCharge: toNumber(
            hypothecation.processingCharge ?? hypothecation.apronCharge,
          ),

          loanRoi: toNumber(hypothecation.loanRoi ?? hypothecation.loanROI),

          marginMoney,

          paymentStatus: hypothecation.paymentStatus || "pending",

          assignBy: hypothecation.assignBy || null,

          // =================================
          // CASH PAYMENT
          // =================================

          cashAmount,

          cashAccountId: toOptionalInt(hypothecation.cashAccountId),

          // =================================
          // BANK PAYMENT
          // =================================

          bankAmount,

          bankAccountId: toOptionalInt(hypothecation.bankAccountId),

          paymentMode: hypothecation.paymentMode || null,

          chequeNo: hypothecation.chequeNo || null,

          chequeDate: toOptionalDate(hypothecation.chequeDate),

          clearDate: toOptionalDate(hypothecation.clearDate),

          narration: hypothecation.narration || null,

          // =================================
          // EXCHANGE DETAILS
          // =================================

          existingCustomerModel: exchange.existingCustomerModel || null,

          existingCustomerVariant: exchange.existingCustomerVariant || null,

          existingVehicleYear: exchange.existingVehicleYear || null,

          customerExpectedPrice: toNumber(exchange.customerExpectedPrice),

          marketPrice: toNumber(exchange.marketPrice),

          exchangeChassisNo: exchange.chassisNo || null,

          companyShare: toNumber(exchange.companyShare),

          dealerShares: toNumber(exchange.dealerShares),

          rcNo: exchange.rcNo || null,

          exchangeInsurance:
            exchange.insurance != null ? String(exchange.insurance) : null,

          vehicleNo: exchange.vehicleNo || null,

          // =================================
          // PAYMENT DETAILS
          // =================================

          discount: toNumber(payment.discount),

          schemeDiscount: toNumber(payment.schemeDiscount),

          exchangeDiscount: toNumber(payment.exchangeDiscount),

          invoiceAmount: toNumber(payment.invoiceAmount),

          total: toNumber(payment.total),

          receivedAmount: toNumber(payment.receivedAmount),

          pendingAmount: toNumber(payment.pendingAmount),

          // =================================
          // BROKER DETAILS
          // =================================

          brokerName: broker.brokerName || null,

          brokerAmount: toNumber(broker.brokerAmount),

          // =================================
          // DELIVERY DETAILS
          // =================================

          invoiceBill: Boolean(delivery.invoiceBill),

          accessoriesInvoice: Boolean(delivery.accessoriesInvoice),

          serviceBook: Boolean(delivery.serviceBook),

          insuranceCopy: Boolean(delivery.insuranceCopy),

          helmetInvoice: Boolean(delivery.helmetInvoice),

          warrantyBook: Boolean(delivery.warrantyBook),

          keychainPouch: Boolean(delivery.keychainPouch),

          allGuard: Boolean(delivery.allGuard),

          matting: Boolean(delivery.matting),

          footrest: Boolean(delivery.footrest),

          helmet: Boolean(delivery.helmet),

          visor: Boolean(delivery.visor),

          seatCover: Boolean(delivery.seatCover),

          bodyCover: Boolean(delivery.bodyCover),

          mirrorSet: Boolean(delivery.mirrorSet),

          other: Boolean(delivery.other),

          createdBy: name,
          createdById: userId,
          createdType: role,
        },

        include: {
          company: true,

          financialYear: true,

          lead: true,

          finance: {
            include: {
              account: true,
            },
          },

          cashAccount: true,

          bankAccount: true,
        },
      });
      if (selectedAccessories.length > 0) {
        await tx.orderAccessory.createMany({
          data: selectedAccessories.map((item: any) => ({
            orderId: createdOrder.id,
            accessoryId: Number(item.accessoryId ?? item.id),
            salesPrice: Number(item.price),
            qty: Number(item.qty ?? 1),
            status: "Pending",
          })),
        });
      }
      if (allotment.chassisNo) {
        await tx.purchaseItem.update({
          where: {
            chassisNo: allotment.chassisNo,
          },
          data: {
            status: "Booked",
          },
        });
      }
      // =====================================
      // CREATE CASH RECEIPT — DCPR
      // =====================================

      if (
        hypothecation.paymentStatus === "received" &&
        cashAmount > 0 &&
        customerAccountId !== null
      ) {
        await tx.cashReceipt.create({
          data: {
            voucherNo: await generateCashReceiptVoucher(),

            date: new Date(),

            companyId: Number(companyId),

            financialYearId: Number(financialYearId),

            cashAccountId: Number(hypothecation.cashAccountId),

            oppAccountId: customerAccountId,

            leadId: Number(leadId),

            amount: cashAmount,

            narration: hypothecation.narration || "Order margin cash received",

            type: "DPCR",

            createdType: role,

            createdBy: name,
          },
        });

        // Increase Cash Account balance
        await tx.account.update({
          where: {
            id: Number(hypothecation.cashAccountId),
          },

          data: {
            closingBalance: {
              increment: cashAmount,
            },
          },
        });
      }
      // =====================================
      // CREATE BANK RECEIPT — DPBR
      // =====================================

      if (
        hypothecation.paymentStatus === "received" &&
        bankAmount > 0 &&
        customerAccountId !== null
      ) {
        await tx.bankReceipt.create({
          data: {
            voucherNo: await generateBankReceiptVoucher(),

            date: new Date(),

            companyId: Number(companyId),

            financialYearId: Number(financialYearId),

            bankAccountId: Number(hypothecation.bankAccountId),

            // Customer account from Lead
            oppAccountId: customerAccountId,

            leadId: Number(leadId),

            amount: bankAmount,

            paymentType: hypothecation.paymentMode || "UPI",

            chequeNo:
              hypothecation.paymentMode === "CHEQUE"
                ? hypothecation.chequeNo || null
                : null,

            chequeDate:
              hypothecation.paymentMode === "CHEQUE"
                ? toOptionalDate(hypothecation.chequeDate)
                : null,

            chequeClearDate:
              hypothecation.paymentMode === "CHEQUE"
                ? toOptionalDate(hypothecation.clearDate)
                : null,

            narration: hypothecation.narration || "Order margin bank received",

            type: "DPBR",

            createdType: role,

            createdBy: name,
          },
        });

        // Increase Bank Account balance
        await tx.account.update({
          where: {
            id: Number(hypothecation.bankAccountId),
          },

          data: {
            closingBalance: {
              increment: bankAmount,
            },
          },
        });
      }

      return createdOrder;
    });
    return res.status(201).json({
      success: true,

      message: "Order created successfully",

      data: order,
    });
  } catch (error: any) {
    console.error("CREATE ORDER ERROR:", error);

    // Prisma unique error
    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,

        message: "Order already exists for this lead",
      });
    }

    // Prisma relation error
    if (error?.code === "P2003") {
      return res.status(400).json({
        success: false,

        message:
          "Invalid company, financial year, lead, finance, cash account, or bank account",
      });
    }

    return res.status(500).json({
      success: false,

      message: "Failed to create order",

      error: error?.message,
    });
  }
};

// ==========================================
// GET ALL ORDERS
// GET /api/orders
// ==========================================
export const saveAccessoriesAllotment = async (
  req: Request,
  res: Response
) => {
  try {
    const orderId = Number(req.params.id);

    const { invoiceNo, invoiceDate } = req.body;

    if (!invoiceNo || !invoiceDate) {
      return res.status(400).json({
        success: false,
        message: "Invoice No and Invoice Date are required.",
      });
    }

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          orderAccessories: true,
        },
      });

      if (!order) {
        throw new Error("Order not found.");
      }

      // const pendingAccessories = order.orderAccessories.filter(
      //   (item) => item.status !== "Completed"
      // );

      // if (pendingAccessories.length > 0) {
      //   throw new Error("Please allot all accessories first.");
      // }

      if (order.invoiceNo) {
        throw new Error("Invoice already generated.");
      }

      const existing = await tx.order.findFirst({
        where: {
          invoiceNo,
        },
      });

      if (existing) {
        throw new Error("Invoice No already exists.");
      }

      await tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          invoiceNo,
          invoiceDate: new Date(invoiceDate),
          accessoriesAllotStatus: "Completed",
        },
      });
    });

    return res.json({
      success: true,
      message: "Accessories allotment saved successfully.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Add this to your backend controller file

// ==========================================
// GET VEHICLE VERIFY ACCESSORIES
// GET /api/orders/vehicle-verify-accessories
// ==========================================

// ==========================================
// GET VEHICLE VERIFY ACCESSORIES
// GET /api/orders/vehicle-verify-accessories
// ==========================================

export const getVehicleVerifyAccessories = async (
  req: Request,
  res: Response
) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        accessoriesAllotStatus: "Completed",
        invoiceNo: {
          not: null,
        },
      },
      orderBy: {
        invoiceDate: "desc",
      },
      include: {
        lead: {
          include: {
            customer: true,
            executive: true,
            model: true,
            showroomVariant: true,
            colour: true,
          },
        },
        orderAccessories: {
          include: {
            accessory: true,
          },
        },
      },
    });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No verified vehicle order found",
      });
    }

    const data = orders.map((order, index) => {
      // Accessories Allot Stage
      const completedAccessories = order.orderAccessories.filter(
        (item) => item.status === "Completed"
      );

      const pendingAccessories = order.orderAccessories.filter(
        (item) => item.status === "Pending"
      );

      return {
        srNo: index + 1,
        id: order.id,

        accountName: order.lead?.customer?.accountName || "-",
        mobileNo: order.lead?.customer?.mobile || "-",
        quotationNo: order.lead?.quotationNo || "-",
        dmsEnquiryNo: order.lead?.dmsEnquiryNo || "-",

        dmsEnquiryDate: order.lead?.dmsEnquiryDate
          ? new Date(order.lead.dmsEnquiryDate).toLocaleDateString("en-GB")
          : "-",

        salesExecutive: order.lead?.executive?.employeeName || "-",

        model: order.model || order.lead?.model?.modelName || "-",

        variant:
          order.variant ||
          order.lead?.showroomVariant?.variantName ||
          "-",

        color:
          order.colour ||
          order.lead?.colour?.colourName ||
          "-",

        chassisNo: order.chassisNo || "-",

        invoiceNo: order.invoiceNo || "-",

        invoiceDate: order.invoiceDate
          ? new Date(order.invoiceDate).toLocaleDateString("en-GB")
          : "-",

        // Counts for table
        allotted: completedAccessories.length,
        pending: pendingAccessories.length,

        // ➕ Allotted Modal
        allottedAccessories: completedAccessories.map((item) => ({
          id: item.id,
          itemId: item.accessoryId,
          itemName: item.accessory?.itemName || "-",
          itemCode: item.accessory?.codeNo || "-",
          hsnCode: item.accessory?.hsnCode || "-",
          selectedStock: item.qty,
          tax: item.accessory?.taxSlab,
          salesPrice: item.salesPrice,
          status: item.status.toLowerCase(),
          verifyStatus: item.verifyStatus.toLowerCase(),
        })),

        // 👁 Pending Modal
        pendingAccessories: pendingAccessories.map((item) => ({
          id: item.id,
          itemId: item.accessoryId,
          itemName: item.accessory?.itemName || "-",
          itemCode: item.accessory?.codeNo || "-",
          hsnCode: item.accessory?.hsnCode || "-",
          selectedStock: item.qty,
          tax: item.accessory?.taxSlab,
          salesPrice: item.salesPrice,
          status: item.status.toLowerCase(),
          verifyStatus: item.verifyStatus.toLowerCase(),
        })),
      };
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("GET VEHICLE VERIFY ACCESSORIES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle verify accessories",
      error: error.message,
    });
  }
};
// ==========================================
// VERIFY SINGLE ACCESSORY ITEM (checkbox click)
// PATCH /api/orders/vehicle-verify-accessories/:orderId/item/:itemId
// itemId yahan OrderAccessory.id hai
// ==========================================

export const verifyAccessoryItem = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.orderId);
    const itemId = Number(req.params.itemId);

    const orderAccessory = await prisma.orderAccessory.findFirst({
      where: {
        id: itemId,
        orderId,
      },
    });

    if (!orderAccessory) {
      return res.status(404).json({
        success: false,
        message: "Accessory item not found for this order.",
      });
    }

    if (orderAccessory.verifyStatus === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Item already verified.",
      });
    }

    await prisma.orderAccessory.update({
      where: { id: itemId },
      data: { verifyStatus: "Completed" },
    });

    return res.json({
      success: true,
      message: "Item verified successfully.",
    });
  } catch (error: any) {
    console.error("VERIFY ACCESSORY ITEM ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify accessory item.",
    });
  }
};
export const getOrders = async (req: Request, res: Response) => {
  try {
    const { companyId, financialYearId } = req.query;

    const orders = await prisma.order.findMany({
      where: {
        ...(companyId && {
          companyId: Number(companyId),
        }),

        ...(financialYearId && {
          financialYearId: Number(financialYearId),
        }),
      },

      include: {
        company: true,

        financialYear: true,

        lead: {
          include: {
            customer: true,
            model: true,
            showroomVariant: true,
            colour: true,
          },
        },

        finance: {
          include: {
            account: true,
          },
        },
        employee: {
          select: {
            id: true,
            employeeName: true,
          },
        },
        cashAccount: true,

        bankAccount: true,
      },

      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).json({
      success: true,

      data: orders,
    });
  } catch (error: any) {
    console.error("GET ORDERS ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch orders",

      error: error?.message,
    });
  }
};
// ==========================================
// GET VEHICLE INCHARGE LIST
// Har Order create hote hi yahan entry dikhegi
// GET /api/orders/vehicle-incharge
// ==========================================

export const getVehicleInchargeList = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const whereClause: any = {};

    // Branch/Sales Executive ka data unke hisaab se filter (agar lead se linked ho)
    if (user?.role?.toUpperCase() === "BRANCH") {
      whereClause.lead = { branchId: Number(user.branchId) };
    }
    if (user?.role?.toUpperCase() === "SALES EXECUTIVE") {
      whereClause.lead = { executiveId: Number(user.id) };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        lead: {
          include: {
            customer: true,
            executive: true,
            model: true,
            showroomVariant: true,
            colour: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    const data = orders.map((order) => ({
      id: order.id,

      accountName: order.lead?.customer?.accountName || "-",

      mobileNo: order.lead?.customer?.mobile || "-",

      quotationNo: order.lead?.quotationNo || "-",

      dmsEnquiryNo: order.lead?.dmsEnquiryNo || "-",

      dmsEnquiryDate: order.lead?.dmsEnquiryDate
        ? new Date(order.lead.dmsEnquiryDate).toLocaleDateString("en-GB")
        : "-",

      salesExecutive: order.lead?.executive?.employeeName || "-",

      // Order ke apne allotment fields pehle try karo, warna Lead ke fallback
      model: order.model || order.lead?.model?.modelName || "-",

      variant: order.variant || order.lead?.showroomVariant?.variantName || "-",

      color: order.colour || order.lead?.colour?.colourName || "-",

      chassisNo: order.chassisNo || "-",

      status: order.vehicleInchargeStatus,
    }));

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("GET VEHICLE INCHARGE LIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle incharge list",
      error: error?.message,
    });
  }
};
// ==========================================
// GET ACCESSORIES ALLOT LIST
// GET /api/orders/accessories-allot
// ==========================================

export const getAccessoriesAllotList = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const whereClause: any = {};

    if (user?.role?.toUpperCase() === "BRANCH") {
      whereClause.lead = {
        branchId: Number(user.branchId),
      };
    }

    if (user?.role?.toUpperCase() === "SALES EXECUTIVE") {
      whereClause.lead = {
        executiveId: Number(user.id),
      };
    }
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        lead: {
          include: {
            customer: true,
            executive: true,
            model: true,
            showroomVariant: true,
            colour: true,
          },
        },
        orderAccessories: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    const data = [];

    for (const order of orders) {
      //       const quotation = await prisma.quotationHistory.findFirst({
      //         where: {
      //           leadId: order.leadId,
      //         },
      //         orderBy: {
      //           revisionNo: "desc",
      //         },
      //       });

      //    let accessories: any[] = [];

      // if (
      //   quotation &&
      //   Array.isArray(quotation.selectedAccessories) &&
      //   quotation.selectedAccessories.length > 0
      // ) {
      //   accessories = quotation.selectedAccessories as any[];
      // } else {
      //   accessories =
      //     (order.lead?.showroomVariant?.accessories || []).map((item: any) => ({
      //       id: item.id,
      //       accessoryId: item.accessoryId,
      //       name: item.accessory?.itemName,
      //       qty: item.qty,
      //       price: item.price,
      //       totalPrice: item.totalPrice,
      //     }));
      // }

      // if (accessories.length === 0) {
      //   continue;
      // }
      const accessories = order.orderAccessories;

      if (accessories.length === 0) {
        continue;
      }
      const completedAccessories = accessories.filter(
        (item) => item.status === "Completed",
      ).length;

      const status =
        accessories.length > 0 && completedAccessories === accessories.length
          ? "completed"
          : "pending";
      data.push({
        id: order.id,

        accountName: order.lead?.customer?.accountName || "-",

        mobileNo: order.lead?.customer?.mobile || "-",

        quotationNo: order.lead?.quotationNo || "-",

        dmsEnquiryNo: order.lead?.dmsEnquiryNo || "-",

        dmsEnquiryDate: order.lead?.dmsEnquiryDate
          ? new Date(order.lead.dmsEnquiryDate).toLocaleDateString("en-GB")
          : "-",

        salesExecutive: order.lead?.executive?.employeeName || "-",

        model: order.model || order.lead?.model?.modelName || "-",

        variant:
          order.variant || order.lead?.showroomVariant?.variantName || "-",

        color: order.colour || order.lead?.colour?.colourName || "-",

        chassisNo: order.chassisNo || "-",

        numberOfAccessories: accessories.length,

        status,
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch accessories allot list",
      error: error.message,
    });
  }
};
export const getAccessoriesAllotDetails = async (
  req: Request,
  res: Response,
) => {
  try {
    const orderId = Number(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        lead: {
          include: {
            customer: true,
            executive: true,
            model: true,
            showroomVariant: true,
            colour: true,
          },
        },

        orderAccessories: {
          include: {
            accessory: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const accessories = order.orderAccessories.map((item) => ({
      id: item.id,
      itemId: item.accessoryId,
      itemName: item.accessory?.itemName || "-",
      itemCode: item.accessory?.codeNo || "-",
      hsnCode: item.accessory?.hsnCode || "-",

      selectedStock: item.qty,
      tax: item.accessory?.taxSlab || 0,
      salesPrice: Number(item.salesPrice),
      totalPrice: Number(item.salesPrice) * Number(item.qty),

      // Read status from database
      status: item.status.toLowerCase(),
    }));

    return res.json({
      success: true,
      data: {
        id: order.id,
        accountName: order.lead?.customer?.accountName,
        mobileNo: order.lead?.customer?.mobile,
        quotationNo: order.lead?.quotationNo,
        dmsEnquiryNo: order.lead?.dmsEnquiryNo,
        dmsEnquiryDate: order.lead?.dmsEnquiryDate,
        salesExecutive: order.lead?.executive?.employeeName,
        model: order.model || order.lead?.model?.modelName,
        variant: order.variant || order.lead?.showroomVariant?.variantName,
        color: order.colour || order.lead?.colour?.colourName,
        chassisNo: order.chassisNo,
        accessoriesAllotStatus: order.accessoriesAllotStatus,
        invoiceNo: order.invoiceNo,
        accessories,
      },
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch accessories details",
      error: error.message,
    });
  }
};
export const allotAccessoryStock = async (req: Request, res: Response) => {
  try {
    const allotmentId = Number(req.params.allotmentId);
    const itemId = Number(req.params.itemId);
    const purchaseHistoryId = Number(req.body.purchaseHistoryId);

    await prisma.$transaction(async (tx) => {
      // Find accessory in order
      const orderAccessory = await tx.orderAccessory.findFirst({
        where: {
          orderId: allotmentId,
          accessoryId: itemId,
        },
      });

      if (!orderAccessory) {
        throw new Error("Accessory not found in this order.");
      }

      // Already allotted
      if (orderAccessory.status === "Completed") {
        throw new Error("Accessory already allotted.");
      }

      // Selected purchase stock
      const purchaseItem = await tx.accessoriesPurchaseItem.findUnique({
        where: {
          id: purchaseHistoryId,
        },
      });

      if (!purchaseItem) {
        throw new Error("Purchase stock not found.");
      }

      if (purchaseItem.accessoryId !== itemId) {
        throw new Error("Invalid purchase stock selected.");
      }

      if ((purchaseItem.stock ?? 0) < orderAccessory.qty) {
        throw new Error("Insufficient stock.");
      }

      // Reduce available stock
      await tx.accessoriesPurchaseItem.update({
        where: {
          id: purchaseHistoryId,
        },
        data: {
          stock: {
            decrement: orderAccessory.qty,
          },
        },
      });

      // Mark completed and save purchase source
      await tx.orderAccessory.update({
        where: {
          id: orderAccessory.id,
        },
        data: {
          status: "Completed",
          purchaseItemId: purchaseHistoryId,
        },
      });

      // Check remaining pending accessories
      const pending = await tx.orderAccessory.count({
        where: {
          orderId: allotmentId,
          status: "Pending",
        },
      });

      if (pending === 0) {
        await tx.order.update({
          where: {
            id: allotmentId,
          },
          data: {
            accessoriesAllotStatus: "Completed",
          },
        });
      }
    });

    return res.json({
      success: true,
      message: "Accessory allotted successfully.",
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to allot accessory.",
    });
  }
};
// ==========================================
// GET ORDER BY ID
// GET /api/orders/:id
// ==========================================

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,

        message: "Invalid order ID",
      });
    }

    const order = await prisma.order.findUnique({
      where: {
        id,
      },

      include: {
        company: true,

        financialYear: true,

        lead: {
          include: {
            customer: true,
            model: true,
            showroomVariant: true,
            colour: true,
          },
        },

        finance: {
          include: {
            account: true,
          },
        },

        cashAccount: true,

        bankAccount: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,

        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,

      data: order,
    });
  } catch (error: any) {
    console.error("GET ORDER BY ID ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch order",

      error: error?.message,
    });
  }
};

// ==========================================
// GET ORDER BY LEAD ID
// GET /api/orders/lead/:leadId
// ==========================================

export const getOrderByLeadId = async (req: Request, res: Response) => {
  try {
    const leadId = Number(req.params.leadId);

    if (!Number.isInteger(leadId)) {
      return res.status(400).json({
        success: false,

        message: "Invalid lead ID",
      });
    }

    const order = await prisma.order.findUnique({
      where: {
        leadId,
      },

      include: {
        company: true,

        financialYear: true,

        lead: true,

        finance: {
          include: {
            account: true,
          },
        },

        cashAccount: true,

        bankAccount: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,

        message: "Order not found for this lead",
      });
    }

    return res.status(200).json({
      success: true,

      data: order,
    });
  } catch (error: any) {
    console.error("GET ORDER BY LEAD ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch order",

      error: error?.message,
    });
  }
};
export const completeVehicleIncharge = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    await prisma.order.update({
      where: { id },
      data: {
        vehicleInchargeStatus: "completed",
      },
    });

    return res.json({
      success: true,
      message: "Vehicle verification completed",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const printDeliveryChallan = async (req: Request, res: Response) => {
  try {
    const leadId = Number(req.params.leadId);

    if (!Number.isInteger(leadId)) {
      return res.status(400).send("Invalid lead ID");
    }

    const order = await prisma.order.findUnique({
      where: {
        leadId,
      },
      include: {
        company: true,
        lead: {
          include: {
            customer: true,
            model: true,
            showroomVariant: true,
            colour: true,
            executive: true,
          },
        },
      },
    });

    if (!order) {
      res.status(404);
      return res.send(
        "<h2 style='font-family:sans-serif;text-align:center;margin-top:60px;'>Order not created yet for this lead. Please create the order first.</h2>",
      );
    }

    // Chassis ke against purchase item se Key No / Engine No nikalne ki koshish
    // (agar aapke PurchaseItem model me ye fields hain to bhar jayenge, warna blank rahenge).
    let keyNo = "";
    let engineNo = "";
    if (order.chassisNo) {
      try {
        const purchaseItem = (await prisma.purchaseItem.findUnique({
          where: { chassisNo: order.chassisNo },
        })) as any;
        keyNo = purchaseItem?.keyNo ?? "";
        engineNo = purchaseItem?.engineNo ?? purchaseItem?.engineNumber ?? "";
      } catch {
        // fields exist na karein to silently ignore — challan blank field ke saath print hoga
      }
    }

    const html = generateDeliveryChallanHtml({
      companyName: order.company?.companyName,
      addressLine1: (order.company as any)?.addressLine1 ?? "",
      mobileNumber:
        (order.company as any)?.mobileNumber ??
        (order.company as any)?.mobileNumber ??
        "",
      logoUrl: getFileUrl(order.company?.logo),

      customerName: order.lead?.customer?.accountName ?? "",
      model: order.model ?? order.lead?.model?.modelName ?? "",
      colour: order.colour ?? order.lead?.colour?.colourName ?? "",
      keyNo,
      chassisNo: order.chassisNo ?? "",
      engineNo,
      registrationNo: (order as any).registrationNo ?? "",
      mobileNo: order.lead?.customer?.mobile ?? "",

      financeBankName: order.bankOfFinance ?? "",
      salesExecutive: order.lead?.executive?.employeeName ?? "",

      checklist: {
        invoiceBill: order.invoiceBill,
        accessoriesInvoice: order.accessoriesInvoice,
        serviceBook: order.serviceBook,
        insuranceCopy: order.insuranceCopy,
        helmetInvoice: order.helmetInvoice,
        warrantyBook: order.warrantyBook,
        rtoReceipt: false,
        keychainPouch: order.keychainPouch,
        allGuard: order.allGuard,
        matting: order.matting,
        footrest: order.footrest,
        helmet: order.helmet,
        visor: order.visor,
        seatCover: order.seatCover,
        bodyCover: order.bodyCover,
        mirrorSet: order.mirrorSet,
        other: order.other,
      },
    });

    res.setHeader("Content-Type", "text/html");
    return res.send(html);
  } catch (error: any) {
    console.error("PRINT DELIVERY CHALLAN ERROR:", error);
    res.status(500);
    return res.send(
      "<h2 style='font-family:sans-serif;text-align:center;margin-top:60px;'>Failed to generate delivery challan.</h2>",
    );
  }
};
// ==========================================
// DELETE ORDER
// DELETE /api/orders/:id
// ==========================================

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,

        message: "Invalid order ID",
      });
    }

    const existingOrder = await prisma.order.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,

        message: "Order not found",
      });
    }

    await prisma.order.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,

      message: "Order deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE ORDER ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to delete order",

      error: error?.message,
    });
  }
};
