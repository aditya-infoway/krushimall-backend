import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";



function computeFollowupStage(
  latestFollowup?: { nextScheduledDate: Date | null } | null,
): "PENDING" | "ATTEND" | "DELAY" {
  if (!latestFollowup || !latestFollowup.nextScheduledDate) {
    return "PENDING";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const followupDate = new Date(latestFollowup.nextScheduledDate);
  followupDate.setHours(0, 0, 0, 0);

  return followupDate.getTime() < today.getTime() ? "DELAY" : "ATTEND";
}

export const createWebsiteEnquiry = async (req: Request, res: Response) => {
  try {
    const {
      websiteVariantId,
      fullName,
      email,
      mobileNumber,
      interestedIn,
      message,
    } = req.body;

    const variant = await prisma.websiteVariant.findUnique({
      where: {
        id: Number(websiteVariantId),
      },
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Website Variant not found.",
      });
    }

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


     await prisma.websiteVariant.update({
      where: {
        id: Number(websiteVariantId),
      },
      data: {
        enquiryCount: {
          increment: 1,
        },
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
    const vendor = (req as any).vendor;

    const enquiries = await prisma.websiteEnquiry.findMany({
      where: {
        websiteVariant: {
          vendorId: vendor.vendorId,
        },
      },
      include: {
        websiteVariant: true,
        followUps: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

   const withStage = enquiries.map((e) => ({
      ...e,
      followupStage: computeFollowupStage(e.followUps[0]),
    }));

    return res.json(withStage);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Error fetching enquiries",
    });
  }
};



export const getWebsiteEnquiry = async (
  req: Request,
  res: Response
) => {
  try {
    const vendor = (req as any).vendor;

    const enquiry = await prisma.websiteEnquiry.findFirst({
      where: {
        id: Number(req.params.id),
        websiteVariant: {
          vendorId: vendor.vendorId,
        },
      },
      include: {
        websiteVariant: true,
      },
    });

    if (!enquiry) {
      return res.status(404).json({
        message: "Enquiry not found",
      });
    }

    return res.json(enquiry);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Error fetching enquiry",
    });
  }
};


export const updateStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const vendor = (req as any).vendor;

    const enquiry = await prisma.websiteEnquiry.findFirst({
      where: {
        id: Number(req.params.id),
        websiteVariant: {
          vendorId: vendor.vendorId,
        },
      },
    });

    if (!enquiry) {
      return res.status(404).json({
        message: "Enquiry not found",
      });
    }

    const updated = await prisma.websiteEnquiry.update({
      where: {
        id: enquiry.id,
      },
      data: {
        status: req.body.status,
      },
    });

    return res.json({
      message: "Status Updated",
      data: updated,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Error updating status",
    });
  }
};