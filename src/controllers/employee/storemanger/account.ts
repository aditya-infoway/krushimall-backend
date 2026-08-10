import { Request, Response } from "express";
import * as AccountController from "../../account.js";

export const createAccount = async (
  req: Request,
  res: Response
) => {
  const user = (req as any).user;

  req.body.createdType = user.role?.toUpperCase().replace(/\s+/g, "_");
  req.body.createdBy = user.employeeName || user.name;
  req.body.createdById = user.id;

  return AccountController.createAccount(req, res);
};

export const getAccounts = AccountController.getAccounts;
export const getAccountById = AccountController.getAccountById;
export const updateAccount = AccountController.updateAccount;
export const deleteAccount = AccountController.deleteAccount;