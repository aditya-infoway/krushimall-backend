import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
export const createBranch = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      companyId,
      financialYearId,
      branchCode,
      branchName,
      branchType,
      managerId,
      mobileNo,
      gmailId,
      password,
      gstNo,
      panCardNo,
      address1,
      address2,
      country,
      countryCode,
      state,
      stateCode,
      district,
      city,
      pinCode,
    } = req.body;

    if (
      !companyId ||
      !financialYearId ||
      !branchCode ||
      !branchName ||
      !branchType ||
      !managerId ||
      !mobileNo ||
      !gmailId ||
      !password
    ) {
      res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
      return;
    }

    const existingBranch = await prisma.branch.findUnique({
      where: {
        branchCode,
      },
    });

    if (existingBranch) {
      res.status(400).json({
        success: false,
        message: "Branch code already exists.",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const role = (req as any).user?.role;
    const name = (req as any).user?.name;

    const logoFile = (req as any).file;

    const branch = await prisma.branch.create({
      data: {
        companyId: Number(companyId),
        financialYearId: Number(financialYearId),

        branchCode,
        branchName,
        branchType,

        logo: logoFile ? logoFile.filename : null,

        managerId: Number(managerId),

        mobileNo,
        gmailId,
        password: hashedPassword,

        gstNo,
        panCardNo,

        address1,
        address2,

        country,
        countryCode,

        state,
        stateCode,

        district,
        city,
        pinCode,

        createdBy: name,
        createdType: role,
      },
      include: {
        manager: {
          select: {
            id: true,
            accountName: true,
          },
        },
        company: true,
        financialYear: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Branch created successfully.",
      branch,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Unable to create branch.",
    });
  }
};
export const getBranches = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: {
        id: "desc",
      },
      include: {
        manager: {
          select: {
            id: true,
            accountName: true,
            openingBalance: true,
            closingBalance: true,
            drCr: true,
          },
        },
        company: {
          select: {
            id: true,
            companyName: true,
          },
        },
        financialYear: {
          select: {
            id: true,
            financialYear: true,
          },
        },
      },
    });

    res.status(200).json(branches);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch branches.",
    });
  }
};
export const getBranchById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    const branch = await prisma.branch.findUnique({
      where: {
        id,
      },
      include: {
        manager: true,
        company: true,
        financialYear: true,
      },
    });

    if (!branch) {
      res.status(404).json({
        success: false,
        message: "Branch not found.",
      });
      return;
    }

    res.status(200).json(branch);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch branch.",
    });
  }
};

export const updateBranch = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    console.log("Password received:", req.body.password);

    if (!id || Number.isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid branch id.",
      });
      return;
    }

    const {
      branchCode,
      branchName,
      branchType,
      managerId,
      mobileNo,
      gmailId,
      password,
      gstNo,
      panCardNo,
      address1,
      address2,
      country,
      countryCode,
      state,
      stateCode,
      district,
      city,
      pinCode,
      isActive,
    } = req.body;

    // Validate manager
    const parsedManagerId = Number(managerId);
    if (!managerId || Number.isNaN(parsedManagerId)) {
      res.status(400).json({
        success: false,
        message: "Valid manager is required.",
      });
      return;
    }

    // Check for duplicate branchCode / gmailId / gstNo on OTHER branches
    const orConditions: any[] = [];
    if (branchCode) orConditions.push({ branchCode });
    if (gmailId) orConditions.push({ gmailId });
    if (gstNo) orConditions.push({ gstNo });

    if (orConditions.length > 0) {
      const existing = await prisma.branch.findFirst({
        where: {
          id: { not: id },
          OR: orConditions,
        },
      });

      if (existing) {
        res.status(400).json({
          success: false,
          message: "Branch code, Gmail ID, or GST number already in use.",
        });
        return;
      }
    }

    // FormData sends everything as strings — coerce isActive to a real boolean
    const parsedIsActive =
      isActive === undefined
        ? undefined
        : isActive === true || isActive === "true";

    const logoFile = (req as any).file;

    const data: any = {
      branchCode,
      branchName,
      branchType,
      manager: {
        connect: {
          id: parsedManagerId,
        },
      },
      mobileNo,
      gmailId,
      gstNo,
      panCardNo,
      address1,
      address2,
      country,
      countryCode,
      state,
      stateCode,
      district,
      city,
      pinCode,
      ...(parsedIsActive !== undefined ? { isActive: parsedIsActive } : {}),
      ...(logoFile ? { logo: logoFile.filename } : {}),
    };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const branch = await prisma.branch.update({
      where: {
        id,
      },
      data,
      include: {
        manager: {
          select: {
            id: true,
            accountName: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Branch updated successfully.",
      branch,
    });
  } catch (error: any) {
    console.error("FULL ERROR:");
    console.dir(error, { depth: null });

    res.status(500).json({
      success: false,
      message: "Unable to update branch.",
      error: error.message,
    });
  }
};
export const deleteBranch = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    await prisma.branch.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Branch deleted successfully.",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Unable to delete branch.",
    });
  }
};
export const toggleBranchStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    const branch = await prisma.branch.findUnique({
      where: { id },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!branch) {
      res.status(404).json({
        success: false,
        message: "Branch not found.",
      });
      return;
    }

    const updated = await prisma.branch.update({
      where: { id },
      data: {
        isActive: !branch.isActive,
      },
    });

    res.json({
      success: true,
      message: "Status updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Unable to update status.",
    });
  }
};





export const loginBranch = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
      return;
    }

    const branch = await prisma.branch.findFirst({
      where: {
        gmailId: email,
      },
    });

    if (!branch) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      }); 
      return;
    }

    if (!branch.isActive) {
      res.status(403).json({
        success: false,
        message: "Branch is inactive.",
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, branch.password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    const token = jwt.sign(
      {
        id: branch.id,
        branchId: branch.id,
        name: branch.branchName,
        role: "BRANCH",
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: branch.id,
        branchId: branch.id,
        branchCode: branch.branchCode,
        branchName: branch.branchName,
        email: branch.gmailId,
        role: "BRANCH",
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Unable to login.",
    });
  }
};
