import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
// export const createAccount = async (req: Request, res: Response) => {
//   try {
//     const user = (req as any).user;
//     const role = user?.role?.toUpperCase().replace(/\s+/g, "_");
 
//     if (role === "BRANCH" && !user?.branchId) {
//       return res.status(400).json({
//         success: false,
//         message: "Branch ID missing from token — cannot create account",
//       });
//     }
 
//     // ⚠️ CONFIRMED: schema.prisma mein Account.createdById FK sirf Employee.id
//     // ko point karta hai. Admin/Branch table ka id Employee table mein exist
//     // nahi karta, isliye unke case mein FK todega agar force set kiya.
//     //
//     // Fix: jo bhi ID set karni ho (body se ya user.id se), pehle DB mein
//     // verify karo ki wo Employee row actually exist karti hai. Nahi karti
//     // to null bhejo — createdBy (name) aur createdType (role) string fields
//     // already poori tracking info rakhte hain, unpe FK constraint nahi hai.
//     const rawCreatedById = req.body.createdById
//       ? Number(req.body.createdById)
//       : Number(user?.id);
 
//     let createdById: number | null = null;
 
//     if (rawCreatedById && !Number.isNaN(rawCreatedById)) {
//       const employeeExists = await prisma.employee.findUnique({
//         where: { id: rawCreatedById },
//         select: { id: true },
//       });
//       if (employeeExists) {
//         createdById = rawCreatedById;
//       }
//     }
 
//     const payload = {
//       ...req.body,
 
//       openingBalance: Number(req.body.openingBalance || 0),
//       closingBalance: Number(req.body.openingBalance || 0),
 
//       birthday: req.body.birthday ? new Date(req.body.birthday) : null,
//       anniversary: req.body.anniversary ? new Date(req.body.anniversary) : null,
 
//       createdType: req.body.createdType || role,
//       createdBy: req.body.createdBy || user?.employeeName || user?.name,
//       createdById,
//       branchId: user?.branchId ? Number(user.branchId) : null,
//     };
 
//     const account = await prisma.account.create({
//       data: payload,
//     });
 
//     res.status(201).json({
//       success: true,
//       data: account,
//       message: "Account created successfully",
//     });
//   } catch (error) {
//     console.log("Create Account Error:", error);
 
//     res.status(500).json({
//       success: false,
//       message: "Failed to create account",
//     });
//   }
// };
 

// export const getAccounts = async (req: Request, res: Response) => {
//   try {
//     const user = (req as any).user;
//   const role = user?.role?.toUpperCase().replace(/\s+/g, "_");

//     const whereClause: any = {};

//     if (role === "BRANCH") {
//       whereClause.branchId = Number(user.branchId);
//     } else if (role !== "ADMIN") {
//       // Accountant, Sales Executive, etc.
//       whereClause.createdById = Number(user.id);
//       whereClause.createdType = role;
//     }

//     const accounts = await prisma.account.findMany({
//       where: whereClause,
//       include: {
//         employee: {
//           select: {
//             id: true,
//             employeeName: true,
//           },
//         },
//         createdByBranch: {
//           select: {
//             id: true,
//             branchName: true,
//           },
//         },
//       },
//       orderBy: {
//         id: "desc",
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       data: accounts,
//     });
//   } catch (error) {
//     console.log(error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch accounts",
//     });
//   }
// };

export const createAccount = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const role = user?.role
      ?.toUpperCase()
      .replace(/\s+/g, "_");

    // ==========================================
    // GET LOGGED-IN EMPLOYEE
    // ==========================================

    const employee = await prisma.employee.findUnique({
      where: {
        id: Number(user.id),
      },
      select: {
        id: true,
        employeeName: true,
        role: true,
        teamLeadId: true,
        branchId: true,
      },
    });

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "Employee not found",
      });
    }

    // ==========================================
    // CREATED BY
    // ==========================================

    const createdById = employee.id;

    // ==========================================
    // TEAM LEAD
    // ==========================================

    let teamLeadId: number | null = null;

    if (role === "TEAM_LEAD") {
      teamLeadId = employee.id;
    }

    // ==========================================
    // SALES EXECUTIVE
    // ==========================================

    else if (role === "SALES_EXECUTIVE") {
      teamLeadId = employee.teamLeadId
        ? Number(employee.teamLeadId)
        : null;

      if (!teamLeadId) {
        return res.status(400).json({
          success: false,
          message: "Team Lead is not assigned to this Sales Executive",
        });
      }
    }

    // ==========================================
    // BRANCH
    // ==========================================

    const branchId = employee.branchId
      ? Number(employee.branchId)
      : null;

    // ==========================================
    // CREATE ACCOUNT
    // ==========================================

    const payload = {
      ...req.body,

      openingBalance: Number(req.body.openingBalance || 0),
      closingBalance: Number(req.body.openingBalance || 0),

      birthday: req.body.birthday
        ? new Date(req.body.birthday)
        : null,

      anniversary: req.body.anniversary
        ? new Date(req.body.anniversary)
        : null,

      createdType: role,

      createdBy: employee.employeeName,

      createdById,

      teamLeadId,

      // Automatically taken from Employee
      branchId,
    };

    const account = await prisma.account.create({
      data: payload,
    });

    return res.status(201).json({
      success: true,
      data: account,
      message: "Account created successfully",
    });

  } catch (error) {
    console.log("Create Account Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create account",
    });
  }
};
export const getAccounts = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const role = user?.role
      ?.toUpperCase()
      .replace(/\s+/g, "_");

    const scope = req.query.scope;

    const whereClause: any = {};

    // ==========================================
    // SCOPE = ALL
    // ==========================================

    if (scope === "all") {
      // Everyone gets all accounts
      // No role restriction
    }

    // ==========================================
    // NORMAL ROLE-BASED ACCESS
    // ==========================================

    else {
      if (role === "ADMIN") {
        // Admin sees all
      }

      else if (role === "BRANCH") {
        whereClause.branchId = Number(user.branchId);
      }

      else if (role === "TEAM_LEAD") {
        // Team Lead sees own + team accounts
        whereClause.teamLeadId = Number(user.id);
      }

      else if (role === "SALES_EXECUTIVE") {
        // Sales Executive sees own accounts
        whereClause.createdById = Number(user.id);
        whereClause.createdType = "SALES_EXECUTIVE";
      }

      else {
        whereClause.createdById = Number(user.id);
        whereClause.createdType = role;
      }
    }

    const accounts = await prisma.account.findMany({
      where: whereClause,

      include: {
        employee: {
          select: {
            id: true,
            employeeName: true,
          },
        },

        teamLead: {
          select: {
            id: true,
            employeeName: true,
          },
        },

        createdByBranch: {
          select: {
            id: true,
            branchName: true,
          },
        },
      },

      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: accounts,
    });

  } catch (error) {
    console.log("Get Accounts Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch accounts",
    });
  }
};
export const getAccountById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = user?.role?.toUpperCase().replace(/\s+/g, "_");

    const whereClause: any = {
      id: Number(req.params.id),
    };

    if (role === "BRANCH") {
      whereClause.branchId = Number(user.branchId);
    } else if (role !== "ADMIN") {
      whereClause.createdById = Number(user.id);
      whereClause.createdType = role;
    }

    const account = await prisma.account.findFirst({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            employeeName: true,
          },
        },
        createdByBranch: {
          select: {
            id: true,
            branchName: true,
          },
        },
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch account",
    });
  }
};
export const updateAccount = async (req: Request, res: Response) => {
  try {
    const openingBalance = Number(req.body.openingBalance || 0);

    const account = await prisma.account.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        accountName: req.body.accountName,
        printName: req.body.printName,
        group: req.body.group,
        drCr: req.body.drCr,

        openingBalance,
        closingBalance: openingBalance,

        country: req.body.country,
        countryCode: req.body.countryCode,
        state: req.body.state,
        stateCode: req.body.stateCode,
        district: req.body.district,
        taluka: req.body.taluka,
        city: req.body.city,
        area: req.body.area,
        address1: req.body.address1,
        address2: req.body.address2,
        pincode: req.body.pincode,
        phone: req.body.phone,
        mobile: req.body.mobile,
        email: req.body.email,
        contactPerson: req.body.contactPerson,

        birthday: req.body.birthday ? new Date(req.body.birthday) : null,

        anniversary: req.body.anniversary
          ? new Date(req.body.anniversary)
          : null,

        bankAccountNo: req.body.bankAccountNo,
        bankName: req.body.bankName,
        ifscCode: req.body.ifscCode,
        branch: req.body.branch,
        gstNo: req.body.gstNo,
        panCard: req.body.panCard,
        aadharNo: req.body.aadharNo,

        status: req.body.status,
      },
    });

    res.status(200).json({
      success: true,
      data: account,
      message: "Account updated successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to update account",
    });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    await prisma.account.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
};
