import { Request, Response } from "express";
import * as CashPaymentController from "../../cashPayment.js";

export const getCashPayments = (req: Request, res: Response) =>
  CashPaymentController.getCashPayments(req, res);

export const getCashPaymentById = (req: Request, res: Response) =>
  CashPaymentController.getCashPaymentById(req, res);

export const createCashPayment = (req: Request, res: Response) =>
  CashPaymentController.createCashPayment(req, res);

export const updateCashPayment = (req: Request, res: Response) =>
  CashPaymentController.updateCashPayment(req, res);

export const deleteCashPayment = (req: Request, res: Response) =>
  CashPaymentController.deleteCashPayment(req, res);

export const getCashPaymentVoucher = (req: Request, res: Response) =>
  CashPaymentController.getCashPaymentVoucher(req, res);

export const exportCashPaymentExcel = (req: Request, res: Response) =>
  CashPaymentController.exportCashPaymentExcel(req, res);