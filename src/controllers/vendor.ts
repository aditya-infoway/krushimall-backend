// src/controllers/vendor.ts

import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

// ==================== BECOME VENDOR ====================

// Become Vendor - 3 step registration
export const becomeVendor = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      // Step 1: Vendor Type & Personal Details
      vendorType,
      vehicleType,
      name,
      number,
      email,
      
      // Step 2: Address Details
      country,
      state,
      district,
      city,
      address,
      pincode,
      
      // Step 3: Vendor Password
      vendorPassword
    } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (!vendorType || !name || !number || !email) {
      return res.status(400).json({
        success: false,
        message: "Step 1: All personal details are required"
      });
    }

    if (!country || !state || !district || !city || !address || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Step 2: All address fields are required"
      });
    }

    if (!vendorPassword || vendorPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Step 3: Password must be at least 8 characters"
      });
    }

    // Check if user exists
    const user = await prisma.webUser.findUnique({
      where: { id: userId },
      include: { vendor: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if already a vendor
    if (user.vendor) {
      return res.status(400).json({
        success: false,
        message: "You are already registered as a vendor"
      });
    }

    // Check if vendor password is same as login password
    const isSamePassword = await bcrypt.compare(vendorPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "Vendor password must be different from your login password"
      });
    }

    // Hash vendor password
    const hashedVendorPassword = await bcrypt.hash(vendorPassword, 10);

    // Create vendor record and update user profile
    const vendor = await prisma.$transaction(async (tx) => {
      // 1. Create vendor with all 3 steps data
      const newVendor = await tx.webVendor.create({
        data: {
          userId: user.id,
          // Step 1
          vendorType,
          vehicleType: vendorType === "vehicle" ? vehicleType : null,
          name,
          number,
          email,
          // Step 2
          country,
          state,
          district,
          city,
          address,
          pincode,
          // Step 3
          vendorPassword: hashedVendorPassword,
          isVerified: false
        }
      });

      // 2. Update user profile with address from step 2
      await tx.webUser.update({
        where: { id: user.id },
        data: {
          country,
          state,
          district,
          city,
          address,
          pincode
        }
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
        isVerified: vendor.isVerified
      }
    });

  } catch (error) {
    console.error("Become vendor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register as vendor"
    });
  }
};

// ==================== GET VENDOR DATA ====================

// Get vendor data
export const getVendorData = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
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
            pincode: true
          }
        }
      }
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    return res.json({
      success: true,
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
        verifiedAt: vendor.verifiedAt,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
        user: vendor.user
      }
    });

  } catch (error) {
    console.error("Get vendor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get vendor data"
    });
  }
};

// ==================== UPDATE VENDOR ====================

// Update vendor data
export const updateVendor = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Remove sensitive fields that shouldn't be updated here
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.vendorPassword; // Password update should be separate

    // Only allow updating specific fields
    const allowedFields = [
      'vendorType',
      'vehicleType',
      'name',
      'number',
      'email',
      'country',
      'state',
      'district',
      'city',
      'address',
      'pincode'
    ];

    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as any);

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update"
      });
    }

    const vendor = await prisma.webVendor.update({
      where: { userId },
      data: filteredData
    });

    return res.json({
      success: true,
      message: "Vendor data updated successfully",
      vendor
    });

  } catch (error) {
    console.error("Update vendor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update vendor data"
    });
  }
};

// ==================== VENDOR PASSWORD ====================

// Update vendor password
export const updateVendorPassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters"
      });
    }

    // Get vendor with password
    const vendor = await prisma.webVendor.findUnique({
      where: { userId }
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, vendor.vendorPassword);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Check if new password is same as login password
    const user = await prisma.webUser.findUnique({
      where: { id: userId }
    });

    if (user) {
      const isSameAsLogin = await bcrypt.compare(newPassword, user.password);
      if (isSameAsLogin) {
        return res.status(400).json({
          success: false,
          message: "Vendor password must be different from your login password"
        });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.webVendor.update({
      where: { userId },
      data: { vendorPassword: hashedPassword }
    });

    return res.json({
      success: true,
      message: "Vendor password updated successfully"
    });

  } catch (error) {
    console.error("Update vendor password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update vendor password"
    });
  }
};

// ==================== VERIFY VENDOR (ADMIN) ====================

// Verify vendor (admin action)
export const verifyVendor = async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const userId = parseInt(vendorId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID"
      });
    }

    const vendor = await prisma.webVendor.findUnique({
      where: { userId }
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    if (vendor.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Vendor already verified"
      });
    }

    const updatedVendor = await prisma.webVendor.update({
      where: { userId },
      data: {
        isVerified: true,
        verifiedAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: "Vendor verified successfully",
      vendor: updatedVendor
    });

  } catch (error) {
    console.error("Verify vendor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify vendor"
    });
  }
};

// Get all vendors (admin)
export const getAllVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await prisma.webVendor.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json({
      success: true,
      vendors
    });

  } catch (error) {
    console.error("Get all vendors error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get vendors"
    });
  }
};