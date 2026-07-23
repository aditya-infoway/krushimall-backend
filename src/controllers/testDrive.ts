import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createTestDrive = async (req: Request, res: Response) => {
  try {
    const {
      leadId,
      modelId,
       showroomVariantId,
      colourId,
      testDriveDate,
      testDriveFromTime,
      testDriveToTime,
      duration,
      vehicleSpeedometerRunning,
      licenceNo,
      feedback,
      remarks,
      placeOfTestDrive,
    } = req.body;
const user = (req as any).user;
const role = user?.role?.toUpperCase().replace(/\s+/g, "_");
const name = user?.employeeName || user?.name || "Admin";
    const testDrive = await prisma.testDrive.create({
      data: {
        leadId: Number(leadId),
        modelId: Number(modelId),
        showroomVariantId: Number(showroomVariantId),
        colourId: Number(colourId),

        testDriveDate: new Date(testDriveDate),
        testDriveFromTime,
        testDriveToTime,
        duration,

        vehicleSpeedometerRunning,
        licenceNo,
        feedback,
        remarks,
        placeOfTestDrive,
     createdById: Number(user.id),
    createdBy: name,
    createdType: role,
  },
  include: {
    lead: true,
    model: true,
    showroomVariant: true,
    colour: true,
    employee: true,
  },
    });

    return res.status(201).json({
      success: true,
      message: "Test Drive created successfully",
      data: testDrive,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create Test Drive",
    });
  }
};

export const getTestDrives = async (_req: Request, res: Response) => {
  try {
    const testDrives = await prisma.testDrive.findMany({
     include: {
  lead: true,
  model: true,
  showroomVariant: true,
  colour: true,
  employee: {
    select: {
      id: true,
      employeeName: true,
    },
  },
},
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: testDrives,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Test Drives",
    });
  }
};

export const getTestDriveById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const testDrive = await prisma.testDrive.findUnique({
      where: { id },
      include: {
        lead: true,
        model: true,
        showroomVariant: true,
        colour: true,
         employee: {
    select: {
      id: true,
      employeeName: true,
    },
  },
      },
    });

    if (!testDrive) {
      return res.status(404).json({
        success: false,
        message: "Test Drive not found",
      });
    }

    return res.json({
      success: true,
      data: testDrive,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Test Drive",
    });
  }
};

export const updateTestDrive = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const {
      leadId,
      modelId,
      showroomVariantId,
      colourId,
      testDriveDate,
      testDriveFromTime,
      testDriveToTime,
      duration,
      vehicleSpeedometerRunning,
      licenceNo,
      feedback,
      remarks,
      placeOfTestDrive,
    } = req.body;

    const testDrive = await prisma.testDrive.update({
      where: { id },
      data: {
        leadId: Number(leadId),
        modelId: Number(modelId),
        showroomVariantId: Number(showroomVariantId),
        colourId: Number(colourId),

        testDriveDate: new Date(testDriveDate),
        testDriveFromTime,
        testDriveToTime,
        duration,

        vehicleSpeedometerRunning,
        licenceNo,
        feedback,
        remarks,
        placeOfTestDrive,
      },
    });

    return res.json({
      success: true,
      message: "Updated Successfully",
      data: testDrive,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to update",
    });
  }
};

export const deleteTestDrive = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    await prisma.testDrive.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Deleted Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete",
    });
  }
};
export const getTestDriveHistory = async (_req: Request, res: Response) => {
  try {
    const history = await prisma.testDrive.groupBy({
      by: ["leadId"],
      _count: {
        id: true,
      },
      _max: {
        createdAt: true,
      },
      orderBy: {
        _max: {
          createdAt: "desc",
        },
      },
    });

   const result = await Promise.all(
  history.map(async (item) => {
    const lead = await prisma.lead.findUnique({
      where: {
        id: item.leadId,
      },
      include: {
        customer: {
          select: {
            accountName: true,
            mobile: true,
          },
        },
      },
    });

    return {
      id: lead?.id,
      customerName: lead?.customer?.accountName,
      mobile: lead?.customer?.mobile,
      testDriveCount: item._count.id,
      updatedAt: item._max.createdAt,
    };
  })
);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Test Drive History",
    });
  }
};
export const getTestDriveHistoryByLead = async (
  req: Request,
  res: Response
) => {
  try {
    const leadId = Number(req.params.id);

    const history = await prisma.testDrive.findMany({
      where: {
        leadId,
      },
     include: {
  lead: {
    include: {
      customer: true,
    },
  },
  model: true,
  showroomVariant: true,
  colour: true,
  employee: {
    select: {
      id: true,
      employeeName: true,
    },
  },
},
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Test Drive History Details",
    });
  }
};