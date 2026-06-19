import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
export const createShowroomVariant = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      modelId,
      variantName,
      purPrice,
      purTaxPercent,
      exShowroomPrice,
      exShowroomTaxPercent,
      insurance,
      insuranceTaxPercent,
      rtoCharge,
      rtoTaxType,
      rtoTaxPercent,
      salesPrice,
      status,
      accessories = [],
    } = req.body;

    const existing = await prisma.showroomVariant.findFirst({
      where: {
        modelId: Number(modelId),
        variantName,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Variant already exists for this model",
      });
    }

    const variant =
      await prisma.showroomVariant.create({
        data: {
          modelId: Number(modelId),
          variantName,

          purPrice: Number(purPrice),
          purTaxPercent: Number(purTaxPercent),

          exShowroomPrice: Number(exShowroomPrice),
          exShowroomTaxPercent: Number(exShowroomTaxPercent),

          insurance: Number(insurance),
          insuranceTaxPercent: Number(
            insuranceTaxPercent
          ),

          rtoCharge: Number(rtoCharge),
          rtoTaxType,
          rtoTaxPercent: Number(rtoTaxPercent),

          salesPrice: Number(salesPrice),

          status,

          accessories: {
            create: accessories.map((a: any) => ({
              accessoryName: a.name,
              price: Number(a.price),
              taxPercent: Number(a.taxPercent),
              totalPrice: Number(a.totalPrice),
            })),
          },
        },

        include: {
          accessories: true,
          model: true,
        },
      });

    res.status(201).json({
      success: true,
      data: variant,
      message: "Showroom Variant created successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to create variant",
    });
  }
};
export const getShowroomVariants = async (
  req: Request,
  res: Response
) => {
  try {
    const variants =
      await prisma.showroomVariant.findMany({
        include: {
          model: true,
          accessories: true,
        },

        orderBy: {
          id: "desc",
        },
      });

    const formatted = variants.map((v) => ({
      ...v,
      model: v.model.modelName,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch variants",
    });
  }
};
export const getShowroomVariantById =
  async (req: Request, res: Response) => {
    try {
      const variant =
        await prisma.showroomVariant.findUnique({
          where: {
            id: Number(req.params.id),
          },

          include: {
            accessories: true,
            model: true,
          },
        });

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: "Variant not found",
        });
      }

      res.status(200).json({
        success: true,
        data: variant,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch variant",
      });
    }
  };
  export const updateShowroomVariant =
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      const {
        accessories = [],
        ...rest
      } = req.body;

      const existing =
        await prisma.showroomVariant.findFirst({
          where: {
            id: {
              not: id,
            },

            modelId: Number(rest.modelId),
            variantName: rest.variantName,
          },
        });

      if (existing) {
        return res.status(400).json({
          success: false,
          message:
            "Variant already exists for this model",
        });
      }

      await prisma.showroomVariantAccessory.deleteMany({
        where: {
          showroomVariantId: id,
        },
      });

      const variant =
        await prisma.showroomVariant.update({
          where: { id },

          data: {
            ...rest,

            modelId: Number(rest.modelId),

            purPrice: Number(rest.purPrice),
            purTaxPercent: Number(
              rest.purTaxPercent
            ),

            exShowroomPrice: Number(
              rest.exShowroomPrice
            ),

            exShowroomTaxPercent: Number(
              rest.exShowroomTaxPercent
            ),

            insurance: Number(rest.insurance),

            insuranceTaxPercent: Number(
              rest.insuranceTaxPercent
            ),

            rtoCharge: Number(rest.rtoCharge),

            rtoTaxPercent: Number(
              rest.rtoTaxPercent
            ),

            salesPrice: Number(rest.salesPrice),

            accessories: {
              create: accessories.map(
                (a: any) => ({
                  accessoryName: a.name,
                  price: Number(a.price),
                  taxPercent: Number(
                    a.taxPercent
                  ),
                  totalPrice: Number(
                    a.totalPrice
                  ),
                })
              ),
            },
          },

          include: {
            accessories: true,
            model: true,
          },
        });

      res.status(200).json({
        success: true,
        data: variant,
        message:
          "Showroom Variant updated successfully",
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        message: "Failed to update variant",
      });
    }
  };
  export const deleteShowroomVariant =
  async (req: Request, res: Response) => {
    try {
      await prisma.showroomVariant.delete({
        where: {
          id: Number(req.params.id),
        },
      });

      res.status(200).json({
        success: true,
        message:
          "Showroom Variant deleted successfully",
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        message: "Failed to delete variant",
      });
    }
  };