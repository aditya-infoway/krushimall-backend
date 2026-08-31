// src/controllers/vendor.ts

import { Response } from "express";
import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { WebAuthedRequest } from "../type/webAuthRequest.js";
import { sendOTPEmail } from "../utils/sendEmail.js";

// Generate OTP (same pattern as webAuth.ts)
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
const isSpareParts = (vendorType?: string | null): boolean => {
  return (vendorType || "").toLowerCase().replace(/[-_\s]+/g, "") === "spareparts";
};


const runVendorLoginChecks = async (
  req: WebAuthedRequest,
  res: Response,
  opts: { restrictToSpareParts: boolean },
) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
    return null;
  }

  const vendor = await prisma.webVendor.findFirst({
    where: { email },
    include: { user: true },
  });

  if (!vendor) {
    res.status(404).json({
      success: false,
      message: "Vendor not found",
    });
    return null;
  }

  if (opts.restrictToSpareParts && !isSpareParts(vendor.vendorType)) {
    res.status(403).json({
      success: false,
      code: "VENDOR_TYPE_NOT_ALLOWED",
      message: "Only Spare Parts vendors can log in to the vendor panel.",
    });
    return null;
  }


  if (!vendor.isVerified) {
    res.status(403).json({
      success: false,
      message: "Please verify your vendor account first. Check your OTP.",
      requiresVerification: true,
      email: vendor.email,
    });
    return null;
  }

  if (vendor.status !== "ACTIVE") {
    res.status(403).json({
      success: false,
      message: "Your vendor account is pending admin approval.",
      status: vendor.status,
    });
    return null;
  }


  const validPassword = await bcrypt.compare(password, vendor.vendorPassword);

  if (!validPassword) {
    res.status(401).json({
      success: false,
      message: "Invalid password",
    });
    return null;
  }

  return vendor;
};



export const becomeVendor = async (req: WebAuthedRequest, res: Response) => {
  try {
  const userId = req.user?.id;
    const {
      vendorType,
      vehicleType,
      name,
      number,
      email,
      country,
      state,
      district,
      city,
      address,
      pincode,
      vendorPassword,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!vendorType || !name || !number || !email) {
      return res.status(400).json({
        success: false,
        message: "Step 1: All personal details are required",
      });
    }

    if (!country || !state || !district || !city || !address || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Step 2: All address fields are required",
      });
    }

    if (!vendorPassword || vendorPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Step 3: Password must be at least 8 characters",
      });
    }

    const user = await prisma.webUser.findUnique({
      where: { id: userId },
      include: { vendor: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.vendor) {
      return res.status(400).json({
        success: false,
        message: "You are already registered as a vendor",
      });
    }

    const isSamePassword = await bcrypt.compare(vendorPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "Vendor password must be different from your login password",
      });
    }

    const hashedVendorPassword = await bcrypt.hash(vendorPassword, 10);

    // Generate OTP for vendor email/phone verification
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const vendor = await prisma.$transaction(async (tx) => {
      const newVendor = await tx.webVendor.create({
        data: {
          userId: user.id,
          vendorType,
          vehicleType: vendorType === "vehicle" ? vehicleType : null,
          name,
          number,
          email,
          country,
          state,
          district,
          city,
          address,
          pincode,
          vendorPassword: hashedVendorPassword,
          isVerified: false,
             status: "PENDING",
          otp,
          otpExpiry,
        },
      });

      await tx.webUser.update({
        where: { id: user.id },
        data: { country, state, district, city, address, pincode },
      });

      return newVendor;
    });

    // Send OTP to vendor email
    await sendOTPEmail(email, otp);

    return res.json({
      success: true,
      message: "Vendor account created! Please verify OTP sent to your email/phone.",
      vendor: {
        id: vendor.id,
        vendorType: vendor.vendorType,
        vehicleType: vendor.vehicleType,
        name: vendor.name,
        number: vendor.number,
        email: vendor.email,
        country: vendor.country,
        state: vendor.state,
        district: vendor.district,
        city: vendor.city,
        address: vendor.address,
        pincode: vendor.pincode,
        isVerified: vendor.isVerified,
        // In development, return OTP for testing
        ...(process.env.NODE_ENV === "development" && { otp }),
      },
    });
  } catch (error) {
    console.error("Become vendor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register as vendor",
    });
  }
};

// ==================== VERIFY VENDOR OTP ====================

export const verifyVendorOTP = async (req: WebAuthedRequest, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const vendor = await prisma.webVendor.findFirst({
      where: { email },
      include: { user: true },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    if (vendor.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Vendor already verified",
      });
    }

    if (vendor.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (vendor.otpExpiry && new Date() > vendor.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    const updatedVendor = await prisma.webVendor.update({
      where: { id: vendor.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        otp: null,
        otpExpiry: null,
      },
    });

    const token = jwt.sign(
      {
        vendorId: updatedVendor.id,
        userId: updatedVendor.userId,
        email: updatedVendor.email,
        role: "vendor",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" },
    );

    return res.json({
      success: true,
      message: "Vendor OTP verified successfully",
      token,
      vendor: {
        id: updatedVendor.id,
        userId: updatedVendor.userId,
        vendorType: updatedVendor.vendorType,
        vehicleType: updatedVendor.vehicleType,
        isVerified: updatedVendor.isVerified,
        name: updatedVendor.name,
        email: updatedVendor.email,
        number: updatedVendor.number,
      },
    });
  } catch (error) {
    console.error("Vendor OTP verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify vendor OTP",
    });
  }
};

// ==================== RESEND VENDOR OTP ====================

export const resendVendorOTP = async (req: WebAuthedRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const vendor = await prisma.webVendor.findFirst({ where: { email } });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    if (vendor.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Vendor already verified",
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.webVendor.update({
      where: { id: vendor.id },
      data: { otp, otpExpiry },
    });

    await sendOTPEmail(email, otp);

    return res.json({
      success: true,
      message: "Vendor OTP resent successfully",
      ...(process.env.NODE_ENV === "development" && { otp }),
    });
  } catch (error) {
    console.error("Resend vendor OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resend vendor OTP",
    });
  }
};

// ==================== GET VENDOR DATA ====================

export const getVendorData = async (req: WebAuthedRequest, res: Response) => {
  try {
    const userId = req.vendor?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const vendor = await prisma.webVendor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            country: true,
            state: true,
            district: true,
            city: true,
            address: true,
            pincode: true,
          },
        },
      },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    return res.json({
      success: true,
      vendor: {
        id: vendor.id,
        avatar: vendor.avatar,
        vendorType: vendor.vendorType,
        vehicleType: vendor.vehicleType,
        name: vendor.name,
        number: vendor.number,
        email: vendor.email,
        country: vendor.country,
        state: vendor.state,
        district: vendor.district,
        city: vendor.city,
        address: vendor.address,
        pincode: vendor.pincode,
        isVerified: vendor.isVerified,
        verifiedAt: vendor.verifiedAt,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
        user: vendor.user,
      },
    });
  } catch (error) {
    console.error("Get vendor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get vendor data",
    });
  }
};

// ==================== UPDATE VENDOR ====================

export const updateVendor = async (req: WebAuthedRequest, res: Response) => {
  try {
    const userId = req.vendor?.userId;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.vendorPassword;

    const allowedFields = [
      "vendorType",
      "vehicleType",
      "name",
      "number",
      "email",
      "country",
      "state",
      "district",
      "city",
      "address",
      "pincode",
    ];

    const filteredData = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as any);

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    const avatar = req.file ? `/uploads/${req.file.filename}` : undefined;

    const vendor = await prisma.webVendor.update({
      where: { userId },
      data: {
        ...filteredData,
        ...(avatar && { avatar }),
      },
    });

    return res.json({
      success: true,
      message: "Vendor data updated successfully",
      vendor,
    });
  } catch (error) {
    console.error("Update vendor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update vendor data",
    });
  }
};
// ==================== UPDATE VENDOR STATUS (ADMIN) ====================

export const updateVendorStatus = async (
  req: WebAuthedRequest,
  res: Response,
) => {
  try {
    const vendorId = Number(req.params.vendorId);
    const { status } = req.body;

    // Only these 2 statuses are allowed
    const allowedStatuses = ["PENDING", "ACTIVE"];

    // Validate vendor ID
    if (!vendorId || Number.isNaN(vendorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID",
      });
    }

    // Validate status
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be PENDING or ACTIVE",
      });
    }

    // Find vendor
    const vendor = await prisma.webVendor.findUnique({
      where: {
        id: vendorId,
      },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Update vendor status
    const updatedVendor = await prisma.webVendor.update({
      where: {
        id: vendorId,
      },
      data: {
        status,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        status === "ACTIVE"
          ? "Vendor activated successfully"
          : "Vendor moved to pending successfully",
      vendor: {
        id: updatedVendor.id,
        userId: updatedVendor.userId,
        name: updatedVendor.name,
        email: updatedVendor.email,
        status: updatedVendor.status,
      },
    });
  } catch (error) {
    console.error("Update vendor status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update vendor status",
    });
  }
};
// ==================== VENDOR PASSWORD ====================

export const updateVendorPassword = async (
  req: WebAuthedRequest,
  res: Response,
) => {
  try {
    const userId = req.vendor?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    const vendor = await prisma.webVendor.findUnique({ where: { userId } });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const isValid = await bcrypt.compare(
      currentPassword,
      vendor.vendorPassword,
    );
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const user = await prisma.webUser.findUnique({ where: { id: userId } });

    if (user) {
      const isSameAsLogin = await bcrypt.compare(newPassword, user.password);
      if (isSameAsLogin) {
        return res.status(400).json({
          success: false,
          message: "Vendor password must be different from your login password",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.webVendor.update({
      where: { userId },
      data: { vendorPassword: hashedPassword },
    });

    return res.json({
      success: true,
      message: "Vendor password updated successfully",
    });
  } catch (error) {
    console.error("Update vendor password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update vendor password",
    });
  }
};

// ==================== VERIFY VENDOR (ADMIN) ====================
// Note: these two stay on plain Request — admins aren't webUsers, so
// they should eventually get your existing admin verifyToken middleware
// instead, not verifyWebToken.

export const verifyVendor = async (req: WebAuthedRequest, res: Response) => {
  try {
    const vendorId = Array.isArray(req.params.vendorId)
      ? req.params.vendorId[0]
      : req.params.vendorId;

    const userId = Number(vendorId);

    if (!vendorId || Number.isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID",
      });
    }

    const vendor = await prisma.webVendor.findUnique({ where: { userId } });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    if (vendor.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Vendor already verified",
      });
    }

    const updatedVendor = await prisma.webVendor.update({
      where: { userId },
      data: { isVerified: true, verifiedAt: new Date() },
    });

    return res.json({
      success: true,
      message: "Vendor verified successfully",
      vendor: updatedVendor,
    });
  } catch (error) {
    console.error("Verify vendor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify vendor",
    });
  }
};

export const getAllVendors = async (req: WebAuthedRequest, res: Response) => {
  try {
    const vendors = await prisma.webVendor.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, vendors });
  } catch (error) {
    console.error("Get all vendors error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get vendors",
    });
  }
};

// ==================== VENDOR LOGIN (MAIN WEBSITE) ====================
// Used by the main KrushiMall website's "Login As: Vendor" form (localhost:5173).
// ANY vendor type (tractor, vehicle, equipment, spare parts, etc.) can log in here.
// No vendorType restriction.

export const vendorLogin = async (
  req: WebAuthedRequest,
  res: Response,
) => {
  try {
    const vendor = await runVendorLoginChecks(req, res, {
      restrictToSpareParts: false,
    });
    if (!vendor) return; // response already sent by runVendorLoginChecks

    // ==========================================
    // GENERATE TOKEN
    // ==========================================
    const token = jwt.sign(
      {
        vendorId: vendor.id,
        userId: vendor.userId,
        email: vendor.email,
        role: "vendor",
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "1d",
      },
    );

    return res.json({
      success: true,
      message: "Vendor login successful",
      token,
      vendor: {
        id: vendor.id,
        userId: vendor.userId,
        vendorType: vendor.vendorType,
        vehicleType: vendor.vehicleType,
        isVerified: vendor.isVerified,
        status: vendor.status,
        name: vendor.name,
        email: vendor.email,
        number: vendor.number,
      },
    });
  } catch (error) {
    console.error("Vendor login error:", error);

    return res.status(500).json({
      success: false,
      message: "Vendor login failed",
    });
  }
};

// ==================== VENDOR LOGIN (DEDICATED VENDOR PANEL) ====================
// Used by the separate Vendor Panel app (localhost:5174/krushimall-admin/login).
// ONLY Spare Parts vendors are allowed to log in here — everyone else gets
// VENDOR_TYPE_NOT_ALLOWED. Point the Vendor Panel frontend's login call at this
// endpoint (e.g. POST /vendor/panel-login) instead of /vendor/login.

export const vendorPanelLogin = async (
  req: WebAuthedRequest,
  res: Response,
) => {
  try {
    const vendor = await runVendorLoginChecks(req, res, {
      restrictToSpareParts: true,
    });
    if (!vendor) return; // response already sent by runVendorLoginChecks

    // ==========================================
    // GENERATE TOKEN
    // ==========================================
    const token = jwt.sign(
      {
        vendorId: vendor.id,
        userId: vendor.userId,
        email: vendor.email,
        role: "vendor",
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "1d",
      },
    );

    return res.json({
      success: true,
      message: "Vendor login successful",
      token,
      vendor: {
        id: vendor.id,
        userId: vendor.userId,
        vendorType: vendor.vendorType,
        vehicleType: vendor.vehicleType,
        isVerified: vendor.isVerified,
        status: vendor.status,
        name: vendor.name,
        email: vendor.email,
        number: vendor.number,
      },
    });
  } catch (error) {
    console.error("Vendor panel login error:", error);

    return res.status(500).json({
      success: false,
      message: "Vendor login failed",
    });
  }
};