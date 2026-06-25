import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createTractor = async (
  req: Request,
  res: Response
) => {
  try {
  const tractor = await prisma.tractor.create({
  data: {
    model: {
      connect: {
        id: Number(req.body.modelId),
      },
    },

    showroomVariant: {
      connect: {
        id: Number(req.body.showroomVariantId),
      },
    },

    colour: {
      connect: {
        id: Number(req.body.colourId),
      },
    },

    itemName: req.body.itemName,
    codeNo: req.body.codeNo,
    shortName: req.body.shortName,
    hsnCode: req.body.hsnCode,
    taxSlab: req.body.taxSlab,
    listOfGroup: req.body.listOfGroup,
    typeOfFuel: req.body.typeOfFuel,
    fuelCapacity: req.body.fuelCapacity,
    purchasePriceNoGST: Number(req.body.purchasePriceNoGST || 0),
    purchasePriceTaxable: Number(req.body.purchasePriceTaxable || 0),
    status: req.body.status || "ACTIVE",
  },
});

    return res.status(201).json({
      success: true,
      data: tractor,
      message: "Tractor created successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create tractor",
    });
  }
};

export const getTractors = async (
  req: Request,
  res: Response
) => {
  try {
    const tractors = await prisma.tractor.findMany({
      include: {
        model: true,
         showroomVariant: true,
        colour: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: tractors,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tractors",
    });
  }
};

export const getTractorById = async (
  req: Request,
  res: Response
) => {
  try {
    const tractor = await prisma.tractor.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        model: true,
          showroomVariant: true,
        colour: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: tractor,
    });
  } catch (error) {
    console.log(error);
  }
};

export const updateTractor = async (
  req: Request,
  res: Response
) => {
  try {
    const tractor = await prisma.tractor.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        modelId: req.body.modelId
          ? Number(req.body.modelId)
          : undefined,

      showroomVariantId: req.body.showroomVariantId
  ? Number(req.body.showroomVariantId)
  : undefined,

        colourId: req.body.colourId
          ? Number(req.body.colourId)
          : undefined,

        itemName: req.body.itemName,
        codeNo: req.body.codeNo,
        shortName: req.body.shortName,
        hsnCode: req.body.hsnCode,
        taxSlab: req.body.taxSlab,
        listOfGroup: req.body.listOfGroup,
        typeOfFuel: req.body.typeOfFuel,
        fuelCapacity: req.body.fuelCapacity,

        purchasePriceNoGST:
          req.body.purchasePriceNoGST !== undefined
            ? Number(req.body.purchasePriceNoGST)
            : undefined,

        purchasePriceTaxable:
          req.body.purchasePriceTaxable !== undefined
            ? Number(req.body.purchasePriceTaxable)
            : undefined,

        status: req.body.status,
      },
    });

    return res.status(200).json({
      success: true,
      data: tractor,
      message: "Tractor updated successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update tractor",
    });
  }
};

export const deleteTractor = async (
  req: Request,
  res: Response
) => {
  try {
    await prisma.tractor.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Tractor deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete tractor",
    });
  }
};
export const toggleTractorStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const tractor = await prisma.tractor.findUnique({
      where: { id },
    });

    if (!tractor) {
      return res.status(404).json({
        success: false,
        message: "Tractor not found",
      });
    }

    const updatedTractor = await prisma.tractor.update({
      where: { id },
      data: {
        status:
          tractor.status === "ACTIVE"
            ? "INACTIVE"
            : "ACTIVE",
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedTractor,
      message: "Status updated successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};