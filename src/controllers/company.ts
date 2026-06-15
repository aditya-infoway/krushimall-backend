import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createCompany = async (
  req: Request,
  res: Response
) => {
  try {
     const existingCompany = await prisma.company.findFirst();

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "Company already exists",
      });
    }
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
           companyName : req.body.companyName,
             logo: req.file?.filename || null,
          country: req.body.country,
          state: req.body.state,
          stateCode: req.body.stateCode,

          district: req.body.district,
          city: req.body.city,

          pincode: req.body.pincode,

          addressLine1: req.body.addressLine1,
          addressLine2: req.body.addressLine2,

          mobileNumber: req.body.mobileNumber,
          phoneNumber: req.body.phoneNumber,

          gstNumber: req.body.gstNumber,
          panNumber: req.body.panNumber,

          bankName: req.body.bankName,
          bankHolderName: req.body.bankHolderName,

          ifscCode: req.body.ifscCode,
          branchLocation: req.body.branchLocation,
        },
      });

      await tx.financialYear.create({
        data: {
          companyId: company.id,
           companyName : company. companyName ,

          financialYear: req.body.financialYear,
          fyStartDate: new Date(req.body.fyStartDate),
          fyEndDate: new Date(req.body.fyEndDate),
        },
      });

      return company;
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create company",
    });
  }
};

export const getCompanies = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await prisma.company.findMany({
      include: {
        financialYears: {
          orderBy: {
            fyStartDate: "desc",
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch companies",
    });
  }
};
export const updateCompany = async (
  req: Request,
  res: Response
) => {
  try {
    const logo = req.file?.filename;

    const company = await prisma.company.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        companyName: req.body.companyName,

        ...(logo && { logo }),

        country: req.body.country,
        state: req.body.state,
        stateCode: req.body.stateCode,

        district: req.body.district,
        city: req.body.city,

        pincode: req.body.pincode,

        addressLine1: req.body.addressLine1,
        addressLine2: req.body.addressLine2,

        mobileNumber: req.body.mobileNumber,
        phoneNumber: req.body.phoneNumber,

        gstNumber: req.body.gstNumber,
        panNumber: req.body.panNumber,

        bankName: req.body.bankName,
        bankHolderName: req.body.bankHolderName,

        ifscCode: req.body.ifscCode,
        branchLocation: req.body.branchLocation,
      },
      include: {
        financialYears: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Company updated successfully",
      data: company,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update company",
    });
  }
};