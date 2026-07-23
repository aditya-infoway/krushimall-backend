import { Request, Response } from "express";
import * as LeadController from "../../lead.js";

export const createLead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Sales Executive specific values
     req.body.createdType = user.role?.toUpperCase().replace(/\s+/g, "_");
    req.body.createdBy = user?.employeeName || user?.name;
    req.body.executiveId = user?.id;

    return LeadController.createLead(req, res);
  } catch (error) {
    console.error("Sales Executive Create Lead Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create lead",
    });
  }
};

export const getLeads = async (req: Request, res: Response) => {
  return LeadController.getLeads(req, res);
};

export const getLeadById = async (req: Request, res: Response) => {
  return LeadController.getLeadById(req, res);
};

export const updateQuotation = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = (req as any).user;

    // Override values for Sales Executive
    req.body.createdType = "SALES_EXECUTIVE";
    req.body.createdBy = user?.employeeName || user?.name;

    return LeadController.updateQuotation(req, res);
  } catch (error) {
    console.error("Sales Executive Update Quotation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update quotation",
    });
  }
};

export const generateOrderBillPdf = async (
  req: Request,
  res: Response,
) => {
  return LeadController.generateOrderBillPdf(req, res);
};

export const getQuotationHistoryList = async (
  req: Request,
  res: Response,
) => {
  return LeadController.getQuotationHistoryList(req, res);
};

export const getQuotationHistoryByLeadId = async (
  req: Request,
  res: Response,
) => {
  return LeadController.getQuotationHistoryByLeadId(req, res);
};

export const getBookingBalance = async (
  req: Request,
  res: Response,
) => {
  return LeadController.getBookingBalance(req, res);
};