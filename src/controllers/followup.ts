import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const createFollowUp = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      leadId,
      expectedPurchaseDate,
      nextScheduledDate,
      callTime,
      callResponse,
      discussion,
    } = req.body;

 const count = await prisma.followUp.count({
  where: {
    leadId: Number(leadId),
  },
});

const followup = await prisma.followUp.create({
  data: {
    leadId: Number(leadId),

    expectedPurchaseDate: expectedPurchaseDate
      ? new Date(expectedPurchaseDate)
      : null,

    nextScheduledDate: nextScheduledDate
      ? new Date(nextScheduledDate)
      : null,

    callTime,
    callResponse,
    discussion,

   followupCount: count + 2, // because New card already shows 1
  },
});

    await prisma.lead.update({
      where: {
        id: Number(leadId),
      },
      data: {
        followUpStatus: callResponse,
      },
    });

    res.status(201).json({
      success: true,
      data: followup,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create followup",
    });
  }
};
export const getFollowUpsByLead = async (
  req: Request,
  res: Response
) => {
  try {
    const leadId = Number(req.params.leadId);

    const followup = await prisma.followUp.findFirst({
      where: {
        leadId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: followup ? [followup] : [],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
    });
  }
};