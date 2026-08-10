// import { Request, Response } from "express";
// import prisma from "../lib/prisma.js";
// import jwt from "jsonwebtoken";

// export const login = async (
//   req: Request,
//   res: Response
// ) => {
//   const { email, password } = req.body;

//   const admin = await prisma.admin.findUnique({
//     where: { email },
//   });

//   if (!admin) {
//     return res.status(401).json({
//       message: "Admin not found",
//     });
//   }

//   if (admin.password !== password) {
//     return res.status(401).json({
//       message: "Invalid password",
//     });
//   }

//   const token = jwt.sign(
//     {
//       id: admin.id,
//       email: admin.email,
//     },
//     process.env.JWT_SECRET!,
//     {
//       expiresIn: "7d",
//     }
//   );

//   return res.json({
//     token,
//     user: admin,
//   });
// };
// import { Request, Response } from "express"; 
// import prisma from "../lib/prisma.js"; 
// import jwt from "jsonwebtoken"; 
 
// export const login = async (req: Request, res: Response) => {
//   try {
//     const { email, password, platform } = req.body;

//     const admin = await prisma.admin.findUnique({
//       where: { email },
//     });

//     if (!admin) {
//       return res.status(401).json({
//         message: "Admin not found",
//       });
//     }

//     if (admin.password !== password) {
//       return res.status(401).json({
//         message: "Invalid password",
//       });
//     }

//     const expiresIn = platform === "app" ? "365d" : "8h";

//     const token = jwt.sign(
//       {
//         id: admin.id,
//         email: admin.email,
//         name: admin.name,
//         role: admin.role,
//       },
//       process.env.JWT_SECRET!,
//       { expiresIn }
//     );

//     return res.json({
//       token,
//       user: admin,
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong.",
//     });
//   }
// };

import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, platform } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({
        message: "Admin not found",
      });
    }

    if (admin.password !== password) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    const expiresIn = platform === "app" ? "365d" : "8h";

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn }
    );

    // CHANGED: naya token DB me save — purana session apne aap invalid ho jayega
    await prisma.admin.update({
      where: { id: admin.id },
      data: { activeToken: token },
    });

    return res.json({
      token,
      user: admin,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};
