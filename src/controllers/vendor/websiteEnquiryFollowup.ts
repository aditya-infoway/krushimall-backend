import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { VendorAuthedRequest } from "../../middleware/verifyVendorToken.js";

export const createFollowup = async (req: VendorAuthedRequest, res: Response) => {
  try {
    const vendorId = req.vendor?.vendorId;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Vendor not authenticated",
      });
    }

    const { enquiryId, nextScheduledDate, callTime, callResponse, discussion } =
      req.body;

    if (!enquiryId || !callResponse) {
      return res.status(400).json({
        success: false,
        message: "Enquiry and Call Response are required.",
      });
    }

    const enquiry = await prisma.websiteEnquiry.findFirst({
      where: {
        id: Number(enquiryId),
        websiteVariant: {
          vendorId,
        },
      },
    });

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

   const followup = await prisma.websiteEnquiryFollowup.create({
      data: {
        enquiryId: enquiry.id,
        nextScheduledDate: nextScheduledDate
          ? new Date(nextScheduledDate)
          : null,
        callTime,
        callResponse,
        discussion,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Follow-up added successfully.",
      data: followup,
    });
  } catch (error) {
    console.error("Create Follow-up:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};


/**
 * Get All Follow-ups of an Enquiry
 */
export const getFollowupsByEnquiry = async (req: VendorAuthedRequest, res: Response) => {
  try {
    const vendorId = req.vendor?.vendorId;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Vendor not authenticated",
      });
    }

    const enquiryId = Number(req.params.enquiryId);

    const enquiry = await prisma.websiteEnquiry.findFirst({
      where: {
        id: enquiryId,
        websiteVariant: {
          vendorId,
        },
      },
    });

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

    const [followups, totalCount] = await Promise.all([
      prisma.websiteEnquiryFollowup.findMany({
        where: { enquiryId },
        orderBy: { createdAt: "desc" },
        take: 1,
      }),
      prisma.websiteEnquiryFollowup.count({
        where: { enquiryId },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: followups,
      total: totalCount,
    });
  } catch (error) {
    console.error("Get Follow-up:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

/**
 * Update Follow-up
 */
export const updateFollowup = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const { nextScheduledDate, callTime, callResponse, discussion } = req.body;

    const followup = await prisma.websiteEnquiryFollowup.update({
      where: {
        id,
      },
      data: {
        nextScheduledDate: nextScheduledDate
          ? new Date(nextScheduledDate)
          : null,
        callTime,
        callResponse,
        discussion,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Follow-up updated successfully.",
      data: followup,
    });
  } catch (error) {
    console.error("Update Follow-up:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

/**
 * Delete Follow-up
 */
export const deleteFollowup = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    await prisma.websiteEnquiryFollowup.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Follow-up deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Follow-up:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

export const getTodayFollowups = async (
  req: VendorAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = req.vendor?.vendorId;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Vendor not authenticated",
      });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const followups = await prisma.websiteEnquiryFollowup.findMany({
      where: {
        nextScheduledDate: {
          gte: today,
          lt: tomorrow,
        },

        enquiry: {
          websiteVariant: {
            vendorId: vendorId,
          },
        },
      },

      include: {
        enquiry: {
          include: {
            websiteVariant: {
              select: {
                id: true,
                productName: true,
              },
            },
          },
        },
      },

      orderBy: {
        callTime: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      data: followups,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};
