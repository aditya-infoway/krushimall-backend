import { Request, Response } from "express";
import * as BankReceiptController from "../bankReceipt.js";

export const getBankReceipt = (req: Request, res: Response) =>
  BankReceiptController.getBankReceipt(req, res);

export const getBankReceiptById = (req: Request, res: Response) =>
  BankReceiptController.getBankReceiptById(req, res);

export const createBankReceipt = (req: Request, res: Response) =>
  BankReceiptController.createBankReceipt(req, res);

export const updateBankReceipt = (req: Request, res: Response) =>
  BankReceiptController.updateBankReceipt(req, res);

export const deleteBankReceipt = (req: Request, res: Response) =>
  BankReceiptController.deleteBankReceipt(req, res);

export const getBankReceiptVoucher = (req: Request, res: Response) =>
  BankReceiptController.getBankReceiptVoucher(req, res);

export const exportBankReceiptExcel = (req: Request, res: Response) =>
  BankReceiptController.exportBankReceiptExcel(req, res);

export const printBankReceipt = (req: Request, res: Response) =>
  BankReceiptController.printBankReceipt(req, res);