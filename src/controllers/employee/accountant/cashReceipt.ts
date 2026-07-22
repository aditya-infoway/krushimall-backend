import { Request, Response } from "express";
import * as CashReceiptController from "../../cashReceipt.js";

export const getcashReceipt = (req: Request, res: Response) =>
  CashReceiptController.getcashReceipt(req, res);

export const getcashReceiptById = (req: Request, res: Response) =>
  CashReceiptController.getcashReceiptById(req, res);

export const createCashReceipt = (req: Request, res: Response) =>
  CashReceiptController.createCashReceipt(req, res);

export const updateCashReceipt = (req: Request, res: Response) =>
  CashReceiptController.updateCashReceipt(req, res);

export const deleteCashReceipt = (req: Request, res: Response) =>
  CashReceiptController.deleteCashReceipt(req, res);

export const getCashReceiptVoucher = (req: Request, res: Response) =>
  CashReceiptController.getCashReceiptVoucher(req, res);

export const exportCashReceiptExcel = (req: Request, res: Response) =>
  CashReceiptController.exportCashReceiptExcel(req, res);

export const printCashReceipt = (req: Request, res: Response) =>
  CashReceiptController.printCashReceipt(req, res);