import { Request, Response } from "express";
import * as ContraController from "../../contra.js";

export const getNextContraVoucher = (req: Request, res: Response) =>
  ContraController.getNextContraVoucher(req, res);

export const createContra = (req: Request, res: Response) =>
  ContraController.createContra(req, res);

export const getContras = (req: Request, res: Response) =>
  ContraController.getContras(req, res);

export const getContraById = (req: Request, res: Response) =>
  ContraController.getContraById(req, res);

export const exportContraExcel = (req: Request, res: Response) =>
  ContraController.exportContraExcel(req, res);