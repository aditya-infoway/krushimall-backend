// src/controllers/vendor.ts

import { Response } from "express";
import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { WebAuthedRequest } from "../type/webAuthRequest.js";

// ==================== BECOME VENDOR ====================

export const becomeVendor = async (req: WebAuthedRequest, res: Response) => {
  try {
    
    const userId = req.vendor?.userId;
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
        },
      });

      await tx.webUser.update({
        where: { id: user.id },
        data: { country, state, district, city, address, pincode },
      });

      return newVendor;
    });

    return res.json({
      success: true,
      message: "Successfully registered as a vendor!",
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

// ==================== VENDOR LOGIN ====================

export const vendorLogin = async (req: WebAuthedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
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

    const validPassword = await bcrypt.compare(password, vendor.vendorPassword);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

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
        name: vendor.name,
        email: vendor.email,
        number: vendor.number,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Vendor login failed",
    });
  }
};
