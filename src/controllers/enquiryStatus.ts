import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createEnquiryStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const enquiryStatus =
      await prisma.enquiryStatus.create({
        data: {
          enquiryStatus: req.body.enquiryStatus,
          status: req.body.status || "ACTIVE",
        },
      });

    res.status(201).json({
      success: true,
      data: enquiryStatus,
      message: "Enquiry status created successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to create enquiry status",
    });
  }
};

export const getEnquiryStatuses = async (
  req: Request,
  res: Response
) => {
  try {
    const enquiryStatuses =
      await prisma.enquiryStatus.findMany({
        orderBy: {
          id: "desc",
        },
      });

    res.status(200).json({
      success: true,
      data: enquiryStatuses,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch enquiry statuses",
    });
  }
};

export const getEnquiryStatusById = async (
  req: Request,
  res: Response
) => {
  try {
    const enquiryStatus =
      await prisma.enquiryStatus.findUnique({
        where: {
          id: Number(req.params.id),
        },
      });

    res.status(200).json({
      success: true,
      data: enquiryStatus,
    });
  } catch (error) {
    console.log(error);
  }
};

export const updateEnquiryStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const enquiryStatus =
      await prisma.enquiryStatus.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          enquiryStatus: req.body.enquiryStatus,
          status: req.body.status,
        },
      });

    res.status(200).json({
      success: true,
      data: enquiryStatus,
      message:
        "Enquiry status updated successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to update enquiry status",
    });
  }
};

export const deleteEnquiryStatus = async (
  req: Request,
  res: Response
) => {
  try {
    await prisma.enquiryStatus.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    res.status(200).json({
      success: true,
      message:
        "Enquiry status deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to delete enquiry status",
    });
  }
};

export const toggleEnquiryStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const enquiryStatus =
      await prisma.enquiryStatus.findUnique({
        where: { id },
      });

    if (!enquiryStatus) {
      return res.status(404).json({
        success: false,
        message: "Enquiry status not found",
      });
    }

    const updated =
      await prisma.enquiryStatus.update({
        where: { id },
        data: {
          status:
            enquiryStatus.status === "ACTIVE"
              ? "INACTIVE"
              : "ACTIVE",
        },
      });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};