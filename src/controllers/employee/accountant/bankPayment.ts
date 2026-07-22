import { Request, Response } from "express";
import * as BankPaymentController from "../../bankPayment.js";

export const getBankPayments = (req: Request, res: Response) =>
  BankPaymentController.getBankPayments(req, res);

export const getBankPaymentById = (req: Request, res: Response) =>
  BankPaymentController.getBankPaymentById(req, res);

export const createBankPayment = (req: Request, res: Response) =>
  BankPaymentController.createBankPayment(req, res);

export const updateBankPayment = (req: Request, res: Response) =>
  BankPaymentController.updateBankPayment(req, res);

export const deleteBankPayment = (req: Request, res: Response) =>
  BankPaymentController.deleteBankPayment(req, res);

export const getBankPaymentVoucher = (req: Request, res: Response) =>
  BankPaymentController.getBankPaymentVoucher(req, res);

export const exportBankPaymentExcel = (req: Request, res: Response) =>
  BankPaymentController.exportBankPaymentExcel(req, res);