import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";

export const createWebsiteEnquiry = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      websiteVariantId,
      fullName,
      email,
      mobileNumber,
      interestedIn,
      message,
    } = req.body;

    const enquiry = await prisma.websiteEnquiry.create({
      data: {
        websiteVariantId: Number(websiteVariantId),
        fullName,
        email,
        mobileNumber,
        interestedIn,
        message,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully.",
      data: enquiry,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit enquiry.",
    });
  }
};
export const getWebsiteEnquiries = async (
  req: Request,
  res: Response
) => {
  try {
    const enquiries = await prisma.websiteEnquiry.findMany({
      include: {
        websiteVariant: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(enquiries);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching enquiries",
    });
  }
};
export const getWebsiteEnquiry = async (
  req: Request,
  res: Response
) => {
  const enquiry = await prisma.websiteEnquiry.findUnique({
    where: {
      id: Number(req.params.id),
    },
    include: {
      websiteVariant: true,
    },
  });

  res.json(enquiry);
};
export const updateStatus = async (
  req: Request,
  res: Response
) => {
  const enquiry = await prisma.websiteEnquiry.update({
    where: {
      id: Number(req.params.id),
    },
    data: {
      status: req.body.status,
    },
  });

  res.json({
    message: "Status Updated",
    data: enquiry,
  });
};