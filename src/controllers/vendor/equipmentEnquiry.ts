import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";

// ============================================================
// CREATE EQUIPMENT ENQUIRY
// ============================================================

export const createEquipmentEnquiry = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      equipmentId,
      fullName,
      email,
      mobile,
      state,
      city,
      address,
      pincode,
    } = req.body;

    // =========================
    // VALIDATION
    // =========================

    if (!equipmentId) {
      return res.status(400).json({
        success: false,
        message: "Equipment is required.",
      });
    }

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required.",
      });
    }

    if (!state) {
      return res.status(400).json({
        success: false,
        message: "State is required.",
      });
    }

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City is required.",
      });
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10 digit mobile number.",
      });
    }

    if (pincode && !/^[0-9]{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6 digit pincode.",
      });
    }

    // =========================
    // CHECK EQUIPMENT
    // =========================

    const equipment = await prisma.equipmentVariant.findUnique({
      where: {
        id: Number(equipmentId),
      },
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found.",
      });
    }

    // =========================
    // CREATE ENQUIRY
    // =========================

    const enquiry = await prisma.equipmentEnquiry.create({
      data: {
        equipmentId: Number(equipmentId),
        fullName: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        state: state.trim(),
        city: city.trim(),
        address: address?.trim() || null,
        pincode: pincode?.trim() || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully.",
      data: enquiry,
    });
  } catch (error) {
    console.error("Create equipment enquiry error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit enquiry.",
    });
  }
};

// ============================================================
// GET ALL EQUIPMENT ENQUIRIES
// ============================================================

export const getEquipmentEnquiries = async (
  req: Request,
  res: Response,
) => {
  try {
    const enquiries = await prisma.equipmentEnquiry.findMany({
      include: {
        equipment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: enquiries,
    });
  } catch (error) {
    console.error("Get equipment enquiries error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching enquiries.",
    });
  }
};

// ============================================================
// GET SINGLE EQUIPMENT ENQUIRY
// ============================================================

export const getEquipmentEnquiry = async (
  req: Request,
  res: Response,
) => {
  try {
    const enquiry = await prisma.equipmentEnquiry.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        equipment: true,
      },
    });

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

    return res.json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    console.error("Get equipment enquiry error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching enquiry.",
    });
  }
};

// ============================================================
// UPDATE EQUIPMENT ENQUIRY
// ============================================================

export const updateEquipmentEnquiry = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const {
      equipmentId,
      fullName,
      email,
      mobile,
      state,
      city,
      address,
      pincode,
      status,
    } = req.body;

    // =========================
    // CHECK ENQUIRY
    // =========================

    const enquiry = await prisma.equipmentEnquiry.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

    // =========================
    // CHECK EQUIPMENT
    // =========================

    if (equipmentId !== undefined) {
      const equipment = await prisma.equipmentVariant.findUnique({
        where: {
          id: Number(equipmentId),
        },
      });

      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: "Equipment not found.",
        });
      }
    }

    // =========================
    // VALIDATION
    // =========================

    if (mobile && !/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10 digit mobile number.",
      });
    }

    if (pincode && !/^[0-9]{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6 digit pincode.",
      });
    }

    // =========================
    // UPDATE
    // =========================

    const updated = await prisma.equipmentEnquiry.update({
      where: {
        id: Number(id),
      },
      data: {
        ...(equipmentId !== undefined && {
          equipmentId: Number(equipmentId),
        }),

        ...(fullName !== undefined && {
          fullName: fullName.trim(),
        }),

        ...(email !== undefined && {
          email: email.trim(),
        }),

        ...(mobile !== undefined && {
          mobile: mobile.trim(),
        }),

        ...(state !== undefined && {
          state: state.trim(),
        }),

        ...(city !== undefined && {
          city: city.trim(),
        }),

        ...(address !== undefined && {
          address: address?.trim() || null,
        }),

        ...(pincode !== undefined && {
          pincode: pincode?.trim() || null,
        }),

        ...(status !== undefined && {
          status: status.trim(),
        }),
      },
    });

    return res.json({
      success: true,
      message: "Enquiry updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Update equipment enquiry error:", error);

    return res.status(500).json({
      success: false,
      message: "Error updating enquiry.",
    });
  }
};

// ============================================================
// DELETE EQUIPMENT ENQUIRY
// ============================================================

export const deleteEquipmentEnquiry = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    // =========================
    // CHECK ENQUIRY
    // =========================

    const enquiry = await prisma.equipmentEnquiry.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

    // =========================
    // DELETE
    // =========================

    await prisma.equipmentEnquiry.delete({
      where: {
        id: Number(id),
      },
    });

    return res.json({
      success: true,
      message: "Enquiry deleted successfully.",
    });
  } catch (error) {
    console.error("Delete equipment enquiry error:", error);

    return res.status(500).json({
      success: false,
      message: "Error deleting enquiry.",
    });
  }
};