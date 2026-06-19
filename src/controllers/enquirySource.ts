import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createEnquirySource = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await prisma.enquirySource.create({
      data: {
        enquirySource: req.body.enquirySource,
        status: req.body.status || "ACTIVE",
      },
    });

    res.status(201).json({
      success: true,
      data,
      message: "Enquiry Source created successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to create enquiry source",
    });
  }
};

export const getEnquirySources = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await prisma.enquirySource.findMany({
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
      message: "Failed to fetch enquiry sources",
    });
  }
};

export const getEnquirySourceById = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await prisma.enquirySource.findUnique({
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

export const updateEnquirySource = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await prisma.enquirySource.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        enquirySource: req.body.enquirySource,
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

export const deleteEnquirySource = async (
  req: Request,
  res: Response
) => {
  try {
    await prisma.enquirySource.delete({
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

export const toggleEnquirySourceStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const source =
      await prisma.enquirySource.findUnique({
        where: { id },
      });

    if (!source) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    const updated =
      await prisma.enquirySource.update({
        where: { id },
        data: {
          status:
            source.status === "ACTIVE"
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