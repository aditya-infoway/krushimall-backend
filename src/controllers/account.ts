import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
export const createAccount = async (
  req: Request,
  res: Response
) => {
  try {
    const payload = {
      ...req.body,
      birthday: req.body.birthday
        ? new Date(req.body.birthday)
        : null,

      anniversary: req.body.anniversary
        ? new Date(req.body.anniversary)
        : null,
    };

    const account = await prisma.account.create({
      data: payload,
    });

    res.status(201).json({
      success: true,
      data: account,
      message: "Account created successfully",
    });
  } catch (error) {
    console.log("Create Account Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create account",
    });
  }
};

export const getAccounts = async (
  req: Request,
  res: Response
) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: {
        id: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch accounts",
    });
  }
};

export const getAccountById = async (
  req: Request,
  res: Response
) => {
  try {
    const account = await prisma.account.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.log(error);
  }
};

export const updateAccount = async (
  req: Request,
  res: Response
) => {
  try {
    const account = await prisma.account.update({
      where: {
        id: Number(req.params.id),
      },
      data: req.body,
    });

    res.status(200).json({
      success: true,
      data: account,
      message: "Account updated successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to update account",
    });
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response
) => {
  try {
    await prisma.account.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
};