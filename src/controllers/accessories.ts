import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createAccessory = async (
  req: Request,
  res: Response
) => {
  try {
    const accessory = await prisma.accessory.create({
      data: {
        type: req.body.type,
        itemName: req.body.itemName,
        codeNo: req.body.codeNo,
        shortName: req.body.shortName,
        hsnCode: req.body.hsnCode,
        taxSlab: req.body.taxSlab,
        group: req.body.group,

        purchasePrice: req.body.purchasePrice
          ? Number(req.body.purchasePrice)
          : null,

        salesPrice: req.body.salesPrice
          ? Number(req.body.salesPrice)
          : null,

        mrp: req.body.mrp
          ? Number(req.body.mrp)
          : null,

        opStock: req.body.opStock
          ? Number(req.body.opStock)
          : 0,

        showroomVariants: req.body.showroomVariants || [],

        status: req.body.status || "ACTIVE",
      },
    });

    return res.status(201).json({
      success: true,
      data: accessory,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create item",
    });
  }
};

export const getAccessories = async (
  req: Request,
  res: Response
) => {
  try {
    const items = await prisma.accessory.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch items",
    });
  }
};

export const updateAccessory = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const item = await prisma.accessory.update({
      where: { id },
      data: {
        type: req.body.type,
        itemName: req.body.itemName,
        codeNo: req.body.codeNo,
        shortName: req.body.shortName,
        hsnCode: req.body.hsnCode,
        taxSlab: req.body.taxSlab,
        group: req.body.group,

        purchasePrice: req.body.purchasePrice
          ? Number(req.body.purchasePrice)
          : null,

        salesPrice: req.body.salesPrice
          ? Number(req.body.salesPrice)
          : null,

        mrp: req.body.mrp
          ? Number(req.body.mrp)
          : null,

        opStock: req.body.opStock
          ? Number(req.body.opStock)
          : 0,

       showroomVariants: req.body.showroomVariants || [],

        status: req.body.status,
      },
    });

    return res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update item",
    });
  }
};

export const deleteAccessory = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    await prisma.accessory.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete item",
    });
  }
};