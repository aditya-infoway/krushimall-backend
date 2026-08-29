import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { VendorAuthedRequest } from "../../middleware/verifyVendorToken.js";

// ============================================================
// CREATE EQUIPMENT ENQUIRY FOLLOW-UP
// ============================================================

export const createEquipmentEnquiryFollowup = async (
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

    const {
      enquiryId,
      nextScheduledDate,
      callTime,
      callResponse,
      discussion,
    } = req.body;

    // =========================
    // VALIDATION
    // =========================

    if (!enquiryId || !callResponse) {
      return res.status(400).json({
        success: false,
        message: "Enquiry and Call Response are required.",
      });
    }

    // =========================
    // CHECK ENQUIRY + VENDOR
    // =========================

    const enquiry = await prisma.equipmentEnquiry.findUnique({
      where: {
        id: Number(enquiryId),
      },
      include: {
        equipment: true,
      },
    });

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Equipment enquiry not found.",
      });
    }

    // =========================
    // CHECK VENDOR OWNER
    // =========================

    const isVendorOwner =
      enquiry.equipment?.vendorId === vendorId;

    if (!isVendorOwner) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    // =========================
    // CREATE FOLLOW-UP
    // =========================

    const followup =
      await prisma.equipmentEnquiryFollowup.create({
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
    console.error("Create Equipment Follow-up:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// ============================================================
// GET FOLLOW-UPS BY EQUIPMENT ENQUIRY
// ============================================================

export const getEquipmentEnquiryFollowups = async (
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

    const enquiryId = Number(req.params.enquiryId);

    // =========================
    // CHECK ENQUIRY + VENDOR
    // =========================

    const enquiry = await prisma.equipmentEnquiry.findFirst({
      where: {
        id: enquiryId,

        equipment: {
          vendorId,
        },
      },
    });

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Equipment enquiry not found.",
      });
    }

    // =========================
    // GET FOLLOW-UPS
    // =========================

    const [followups, totalCount] = await Promise.all([
      prisma.equipmentEnquiryFollowup.findMany({
        where: {
          enquiryId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      }),

      prisma.equipmentEnquiryFollowup.count({
        where: {
          enquiryId,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: followups,
      total: totalCount,
    });
  } catch (error) {
    console.error("Get Equipment Follow-up:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// ============================================================
// UPDATE EQUIPMENT ENQUIRY FOLLOW-UP
// ============================================================

export const updateEquipmentEnquiryFollowup = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    const {
      nextScheduledDate,
      callTime,
      callResponse,
      discussion,
    } = req.body;

    // =========================
    // CHECK FOLLOW-UP
    // =========================

    const existingFollowup =
      await prisma.equipmentEnquiryFollowup.findUnique({
        where: {
          id,
        },
      });

    if (!existingFollowup) {
      return res.status(404).json({
        success: false,
        message: "Follow-up not found.",
      });
    }

    // =========================
    // UPDATE
    // =========================

    const followup =
      await prisma.equipmentEnquiryFollowup.update({
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
    console.error("Update Equipment Follow-up:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// ============================================================
// DELETE EQUIPMENT ENQUIRY FOLLOW-UP
// ============================================================

export const deleteEquipmentEnquiryFollowup = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    // =========================
    // CHECK FOLLOW-UP
    // =========================

    const existingFollowup =
      await prisma.equipmentEnquiryFollowup.findUnique({
        where: {
          id,
        },
      });

    if (!existingFollowup) {
      return res.status(404).json({
        success: false,
        message: "Follow-up not found.",
      });
    }

    // =========================
    // DELETE
    // =========================

    await prisma.equipmentEnquiryFollowup.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Follow-up deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Equipment Follow-up:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// ============================================================
// GET TODAY EQUIPMENT FOLLOW-UPS
// ============================================================

export const getTodayEquipmentFollowups = async (
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

    // =========================
    // TODAY DATE RANGE
    // =========================

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);

    tomorrow.setDate(tomorrow.getDate() + 1);

    // =========================
    // GET TODAY FOLLOW-UPS
    // =========================

    const followups =
      await prisma.equipmentEnquiryFollowup.findMany({
        where: {
          nextScheduledDate: {
            gte: today,
            lt: tomorrow,
          },

          enquiry: {
            equipment: {
              vendorId,
            },
          },
        },

        include: {
          enquiry: {
            include: {
              equipment: {
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
    console.error(
      "Get Today Equipment Follow-ups:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};