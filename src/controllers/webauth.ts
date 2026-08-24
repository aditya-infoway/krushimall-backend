// src/controllers/webAuth.ts

import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { WebAuthedRequest } from "../type/webAuthRequest.js";
import { sendOTPEmail } from "../utils/sendEmail.js";
// Generate OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ==================== REGISTER (UNIFIED: USER + VENDOR) ====================

// Register new user OR vendor in a single step.
// registerType: "user" | "vendor"
// If "vendor": vendorType is required ("Vehicle" | "Spare Parts" | "Service")
//              vehicleType is required only when vendorType === "Vehicle" ("New" | "Used")
export const register = async (req: Request, res: Response) => {
  try {
    const {
      registerType, // "user" | "vendor"
      vendorType, // "Vehicle" | "Spare Parts" | "Service"
      vehicleType, // "New" | "Used"
      name,
      email,
      phone,
      country,
      state,
      district,
      city,
      address,
      pincode,
      password,
    } = req.body;

    const type = registerType === "vendor" ? "vendor" : "user";

    // Base validation (Step 1 + Step 3)
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All personal details are required",
      });
    }

    // Address validation (Step 2)
    if (!country || !state || !district || !city || !address || !pincode) {
      return res.status(400).json({
        success: false,
        message: "All address fields are required",
      });
    }

    // Vendor specific validation
    if (type === "vendor") {
      if (!vendorType) {
        return res.status(400).json({
          success: false,
          message: "Vendor type is required",
        });
      }
      if (vendorType === "Vehicle" && !vehicleType) {
        return res.status(400).json({
          success: false,
          message: "Vehicle type is required",
        });
      }
    }

    // Check if user already exists
    const existingUser = await prisma.webUser.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email or phone",
      });
    }

    // Generate OTP (single OTP verifies both user + vendor)
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash password (reused for vendorPassword too, if vendor)
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.webUser.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,

          // Locks this account to the login flow it was created from —
          // "user" -> /webauth/login only, "vendor" -> /vendor/login only
          registerType: type,

          country,
          state,
          district,
          city,
          address,
          pincode,

          otp,
          otpExpiry,
          isVerified: false,
        },
      });

      if (type === "vendor") {
        await tx.webVendor.create({
          data: {
            userId: newUser.id,
            vendorType,
            vehicleType: vendorType === "Vehicle" ? vehicleType : null,
            name,
            number: phone,
            email,

            country,
            state,
            district,
            city,
            address,
            pincode,

            vendorPassword: hashedPassword,
            status: "PENDING",
            isVerified: false,
          },
        });
      }

      return newUser;
    });

    // Send single OTP to email
    await sendOTPEmail(email, otp);

    return res.status(201).json({
      success: true,
      message: `${
        type === "vendor" ? "Vendor" : "User"
      } registered successfully. Please verify OTP.`,
      data: {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        registerType: type,
        // In development, return OTP for testing
        ...(process.env.NODE_ENV === "development" && { otp }),
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong during registration",
    });
  }
};

// Verify OTP — verifies WebUser, and syncs WebVendor.isVerified if a vendor
// record was created alongside it in the unified register flow above.
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
  

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await prisma.webUser.findUnique({
      where: { email },
      include: {
        vendor: true,
      },
    });
   

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User already verified",
      });
    }

    // Check OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check OTP expiry
    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Mark user as verified and clear OTP
    await prisma.webUser.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otp: null,
        otpExpiry: null,
      },
    });

    // If a vendor record was created together with this user (unified
    // register flow), mark it verified too. Admin approval (status field)
    // stays untouched — vendor still needs status: "ACTIVE" to log in.
    if (user.vendor) {
      await prisma.webVendor.update({
        where: { id: user.vendor.id },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      });
    }

    // Vendor-registered accounts must log in through /vendor/login, so we
    // don't hand out a "web" JWT here for them — only user-type accounts
    // get auto-logged-in right after OTP verification.
    const token =
      user.registerType === "vendor"
        ? null
        : jwt.sign(
            {
              id: user.id,
              email: user.email,
              name: user.name,
              type: "web",
            },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" },
          );

    return res.json({
      success: true,
      message: "OTP verified successfully",
      registerType: user.registerType,
      ...(token && { token }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isVerified: true,
        registerType: user.registerType,
        isVendor: user.vendor !== null,
        vendor: user.vendor,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
};

// Resend OTP
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await prisma.webUser.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User already verified",
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.webUser.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpiry,
      },
    });

    console.log(`📧 New OTP for ${email}: ${otp}`);

    return res.json({
      success: true,
      message: "OTP resent successfully",
      ...(process.env.NODE_ENV === "development" && { otp }),
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
    });
  }
};

// ==================== LOGIN ====================

// User login — STRICTLY blocked for accounts that were registered as
// "vendor". Those accounts must use /vendor/login instead.
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user with vendor data
    const user = await prisma.webUser.findUnique({
      where: { email },
      include: {
        vendor: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "No account found with this email.",
      });
    }

    // ==========================================
    // STRICT SEPARATION: accounts registered as
    // vendor cannot log in through the user flow.
    // ==========================================
    if (user.registerType === "vendor") {
      return res.status(403).json({
        success: false,
        code: "USE_VENDOR_LOGIN",
        message:
          "This account is registered as a Vendor. Please log in using the Vendor option.",
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first. Check your OTP.",
        requiresVerification: true,
        email: user.email,
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        code: "INVALID_PASSWORD",
        message: "Incorrect password.",
      });
    }

    // Determine token expiry
    const expiresIn = rememberMe ? "30d" : "7d";

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        type: "web",
      },
      process.env.JWT_SECRET!,
      { expiresIn },
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
        isVendor: false,
        vendor: null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong during login",
    });
  }
};

// ==================== FORGOT PASSWORD ====================

// Forgot Password - Send reset link
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await prisma.webUser.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        type: "reset",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" },
    );

    // In production, send email with reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    console.log(`🔑 Password reset link: ${resetLink}`);

    return res.json({
      success: true,
      message: "Password reset link sent to your email",
      ...(process.env.NODE_ENV === "development" && { resetLink }),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process reset request",
    });
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: number;
        email: string;
        type: string;
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(400).json({
          success: false,
          message: "Reset token has expired. Please request a new one.",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    if (decoded.type !== "reset") {
      return res.status(400).json({
        success: false,
        message: "Invalid token type",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.webUser.update({
      where: { id: decoded.id },
      data: { password: hashedPassword },
    });

    return res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};

// ==================== GET USER ====================

// Get current user with vendor data
export const getCurrentUser = async (req: WebAuthedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await prisma.webUser.findUnique({
      where: { id: userId },
      include: {
        vendor: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        isVerified: user.isVerified,
        registerType: user.registerType,
        isVendor: user.vendor !== null,
        vendor: user.vendor,
        // Profile data
        country: user.country,
        state: user.state,
        district: user.district,
        city: user.city,
        address: user.address,
        pincode: user.pincode,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get user data",
    });
  }
};

// Update user profile
export const updateProfile = async (req: WebAuthedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, phone, country, state, district, city, address, pincode } =
      req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const avatar = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updatedUser = await prisma.webUser.update({
      where: { id: userId },
      data: {
        name,
        phone,
        country,
        state,
        district,
        city,
        address,
        pincode,

        ...(avatar && { avatar }),
      },
      include: {
        vendor: true,
      },
    });

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        isVerified: updatedUser.isVerified,
        registerType: updatedUser.registerType,
        isVendor: updatedUser.vendor !== null,
        vendor: updatedUser.vendor,
        country: updatedUser.country,
        state: updatedUser.state,
        district: updatedUser.district,
        city: updatedUser.city,
        address: updatedUser.address,
        pincode: updatedUser.pincode,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};