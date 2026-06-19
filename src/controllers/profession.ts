import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createProfession = async (
  req: Request,
  res: Response
) => {
  try {
    const profession = await prisma.profession.create({
      data: {
        profession: req.body.profession,
        status: req.body.status || "ACTIVE",
      },
    });

    res.status(201).json({
      success: true,
      data: profession,
      message: "Profession created successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to create profession",
    });
  }
};

export const getProfessions = async (
  req: Request,
  res: Response
) => {
  try {
    const professions = await prisma.profession.findMany({
      orderBy: {
        id: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: professions,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch professions",
    });
  }
};

export const getProfessionById = async (
  req: Request,
  res: Response
) => {
  try {
    const profession = await prisma.profession.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });

    res.status(200).json({
      success: true,
      data: profession,
    });
  } catch (error) {
    console.log(error);
  }
};

export const updateProfession = async (
  req: Request,
  res: Response
) => {
  try {
    const profession = await prisma.profession.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        profession: req.body.profession,
        status: req.body.status,
      },
    });

    res.status(200).json({
      success: true,
      data: profession,
      message: "Profession updated successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to update profession",
    });
  }
};

export const deleteProfession = async (
  req: Request,
  res: Response
) => {
  try {
    await prisma.profession.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    res.status(200).json({
      success: true,
      message: "Profession deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete profession",
    });
  }
};

export const toggleProfessionStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const profession =
      await prisma.profession.findUnique({
        where: { id },
      });

    if (!profession) {
      return res.status(404).json({
        success: false,
        message: "Profession not found",
      });
    }

    const updated =
      await prisma.profession.update({
        where: { id },
        data: {
          status:
            profession.status === "ACTIVE"
              ? "INACTIVE"
              : "ACTIVE",
        },
      });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};