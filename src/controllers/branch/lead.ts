import { Request, Response } from "express";
import * as LeadController from "../lead.js";

// ==========================================
// CREATE LEAD
// ==========================================

export const createLead = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = (req as any).user;

    const branchId = Number(user?.branchId);

    if (!branchId || Number.isNaN(branchId)) {
      return res.status(400).json({
        success: false,
        message: "Valid branch ID is required",
      });
    }

    req.body.createdType = "BRANCH";
    req.body.createdBy =
      user?.branchName ||
      user?.employeeName ||
      user?.name;

    // IMPORTANT: branch comes from token
    req.body.branchId = branchId;

    return LeadController.createLead(req, res);
  } catch (error) {
    console.error("Branch Create Lead Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create lead",
    });
  }
};


// ==========================================
// GET LEADS
// ==========================================

export const getLeads = async (
  req: Request,
  res: Response,
) => {
  return LeadController.getLeads(req, res);
};


export const getLeadPayments =
  LeadController.getLeadPayments;
// ==========================================
// GET LEADS FOR CASH RECEIPT
// ==========================================

export const getLeadsForCashReceipt = async (
  req: Request,
  res: Response,
) => {
  return LeadController.getLeadsForCashReceipt(req, res);
};


// ==========================================
// GET LEAD BY ID
// ==========================================

export const getLeadById = async (
  req: Request,
  res: Response,
) => {
  return LeadController.getLeadById(req, res);
};


// ==========================================
// UPDATE QUOTATION
// ==========================================

export const updateQuotation = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = (req as any).user;

    const branchId = Number(user?.branchId);

    if (!branchId || Number.isNaN(branchId)) {
      return res.status(400).json({
        success: false,
        message: "Valid branch ID is required",
      });
    }

    req.body.createdType = "BRANCH";

    req.body.createdBy =
      user?.branchName ||
      user?.employeeName ||
      user?.name;

    // IMPORTANT
    req.body.branchId = branchId;

    return LeadController.updateQuotation(req, res);
  } catch (error) {
    console.error("Branch Update Quotation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update quotation",
    });
  }
};


// ==========================================
// OTHER QUOTATION APIs
// ==========================================

export const generateOrderBillPdf =
  LeadController.generateOrderBillPdf;

export const getQuotationHistoryList =
  LeadController.getQuotationHistoryList;

export const getQuotationHistoryByLeadId =
  LeadController.getQuotationHistoryByLeadId;

export const getBookingBalance =
  LeadController.getBookingBalance;