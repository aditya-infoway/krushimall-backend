import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createEnquiryType = async (
  req: Request,
  res: Response
) => {
  try {
    const enquiryType = await prisma.enquiryType.create({
      data: {
        enquiryType: req.body.enquiryType,
        status: req.body.status || "ACTIVE",
      },
    });

    res.status(201).json({
      success: true,
      data: enquiryType,
      message: "Created successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to create",
    });
  }
};

export const getEnquiryTypes = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await prisma.enquiryType.findMany({
      orderBy: {
        id: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch",
    });
  }
};

export const getEnquiryTypeById = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await prisma.enquiryType.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);
  }
};

export const updateEnquiryType = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await prisma.enquiryType.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        enquiryType: req.body.enquiryType,
        status: req.body.status,
      },
    });

    res.status(200).json({
      success: true,
      data,
      message: "Updated successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to update",
    });
  }
};

export const deleteEnquiryType = async (
  req: Request,
  res: Response
) => {
  try {
    await prisma.enquiryType.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete",
    });
  }
};
export const toggleEnquiryTypeStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const enquiry = await prisma.enquiryType.findUnique({
      where: { id },
    });

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    const updated = await prisma.enquiryType.update({
      where: { id },
      data: {
        status:
          enquiry.status === "ACTIVE"
            ? "INACTIVE"
            : "ACTIVE",
      },
    });

    res.status(200).json({
      success: true,
      data: updated,
      message: "Status updated",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};