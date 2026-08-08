import { Request, Response } from "express";
import * as AccountController from "../../account.js";

// ==========================================
// CREATE ACCOUNT
// ==========================================

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

// ==========================================
// GET ALL ACCOUNTS
// ==========================================

export const getAccounts =
  AccountController.getAccounts;

// ==========================================
// GET ACCOUNT BY ID
// ==========================================

export const getAccountById =
  AccountController.getAccountById;

// ==========================================
// UPDATE ACCOUNT
// ==========================================

export const updateAccount =
  AccountController.updateAccount;

// ==========================================
// DELETE ACCOUNT
// ==========================================

export const deleteAccount =
  AccountController.deleteAccount;