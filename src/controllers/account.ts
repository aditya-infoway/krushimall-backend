import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
export const createAccount = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = user?.role?.toUpperCase();

    if (role === "BRANCH" && !user?.branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID missing from token — cannot create account",
      });
    }

    const payload = {
      ...req.body,

      openingBalance: Number(req.body.openingBalance || 0),
      closingBalance: Number(req.body.openingBalance || 0),

      birthday: req.body.birthday ? new Date(req.body.birthday) : null,
      anniversary: req.body.anniversary ? new Date(req.body.anniversary) : null,

      createdType: role,
      createdBy:
  req.body.createdBy ||
  user?.employeeName ||
  user?.name,
      createdById:
    req.body.createdById
      ? Number(req.body.createdById)
      : null,
      branchId: role === "BRANCH" ? Number(user.branchId) : null,
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

export const getAccounts = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = user?.role?.toUpperCase();

    const whereClause: any = {};

    if (role === "BRANCH") {
      whereClause.branchId = Number(user.branchId);
    }
    // Admin: no filter — sees everything

    const accounts = await prisma.account.findMany({
      where: whereClause,
        include: {
    employee: {
      select: {
        id: true,
        employeeName: true,
      },
    },
    createdByBranch: {
      select: {
        id: true,
        branchName: true,
      },
    },
  },

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

export const getAccountById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = user?.role?.toUpperCase();

    const whereClause: any = { id: Number(req.params.id) };

    if (role === "BRANCH") {
      whereClause.branchId = Number(user.branchId);
    }

    const account = await prisma.account.findFirst({
      where: whereClause,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch account",
    });
  }
};

export const updateAccount = async (
  req: Request,
  res: Response
) => {
  try {
    const openingBalance = Number(req.body.openingBalance || 0);

    const account = await prisma.account.update({
  where: {
    id: Number(req.params.id),
  },
  data: {
    accountName: req.body.accountName,
    printName: req.body.printName,
    group: req.body.group,
    drCr: req.body.drCr,

    openingBalance,
    closingBalance: openingBalance,

    country: req.body.country,
    countryCode: req.body.countryCode,
    state: req.body.state,
    stateCode: req.body.stateCode,
    district: req.body.district,
    taluka: req.body.taluka,
    city: req.body.city,
    area: req.body.area,
    address1: req.body.address1,
    address2: req.body.address2,
    pincode: req.body.pincode,
    phone: req.body.phone,
    mobile: req.body.mobile,
    email: req.body.email,
    contactPerson: req.body.contactPerson,

    birthday: req.body.birthday
      ? new Date(req.body.birthday)
      : null,

    anniversary: req.body.anniversary
      ? new Date(req.body.anniversary)
      : null,

    bankAccountNo: req.body.bankAccountNo,
    bankName: req.body.bankName,
    ifscCode: req.body.ifscCode,
    branch: req.body.branch,
    gstNo: req.body.gstNo,
    panCard: req.body.panCard,
    aadharNo: req.body.aadharNo,

    status: req.body.status,
  },
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