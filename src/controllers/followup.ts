// import { Request, Response } from "express";
// import prisma from "../lib/prisma.js";

// export const createFollowUp = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const {
//       leadId,
//       expectedPurchaseDate,
//       nextScheduledDate,
//       callTime,
//       callResponse,
//       discussion,
//     } = req.body;

//  const count = await prisma.followUp.count({
//   where: {
//     leadId: Number(leadId),
//   },
// });

// const followup = await prisma.followUp.create({
//   data: {
//     leadId: Number(leadId),

//     expectedPurchaseDate: expectedPurchaseDate
//       ? new Date(expectedPurchaseDate)
//       : null,

//     nextScheduledDate: nextScheduledDate
//       ? new Date(nextScheduledDate)
//       : null,

//     callTime,
//     callResponse,
//     discussion,

//    followupCount: count + 2, // because New card already shows 1
//   },
// });

//     await prisma.lead.update({
//       where: {
//         id: Number(leadId),
//       },
//       data: {
//         followUpStatus: callResponse,
//       },
//     });

//     res.status(201).json({
//       success: true,
//       data: followup,
//     });
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to create followup",
//     });
//   }
// };
// export const getFollowUpsByLead = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const leadId = Number(req.params.leadId);

//     const followup = await prisma.followUp.findFirst({
//       where: {
//         leadId,
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     res.json({
//       success: true,
//       data: followup ? [followup] : [],
//     });
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       success: false,
//     });
//   }
// };




import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function computeBucket(lead: any, latestFollowUp: any | null): string {
  const today = startOfDay(new Date());

  if (latestFollowUp) {
    const createdDay = startOfDay(new Date(latestFollowUp.createdAt));
    if (createdDay.getTime() === today.getTime()) {
      return "Attend"; // acted on today
    }
  }

  const refDate =
    latestFollowUp?.nextScheduledDate || lead.followUpDate;

  if (!refDate) return "Pending"; // no date at all, just show it

  const refDay = startOfDay(new Date(refDate));

  if (refDay.getTime() > today.getTime()) return "Upcoming";
  if (refDay.getTime() === today.getTime()) return "Pending";
  return "Delay";
}

export const createFollowUp = async (req: Request, res: Response) => {
  try {
    const { leadId, expectedPurchaseDate, nextScheduledDate, callTime, callResponse, discussion } = req.body;

    if (!leadId) {
      return res.status(400).json({ success: false, message: "leadId is required" });
    }

    const count = await prisma.followUp.count({ where: { leadId: Number(leadId) } });

    const followup = await prisma.followUp.create({
      data: {
        leadId: Number(leadId),
        expectedPurchaseDate: expectedPurchaseDate ? new Date(expectedPurchaseDate) : null,
        nextScheduledDate: nextScheduledDate ? new Date(nextScheduledDate) : null,
        callTime,
        callResponse,
        discussion,
        followupCount: count + 1,
      },
    });

    await prisma.lead.update({
      where: { id: Number(leadId) },
      data: {
        followUpStatus: callResponse,
        ...(nextScheduledDate ? { followUpDate: new Date(nextScheduledDate) } : {}),
      },
    });

    res.status(201).json({ success: true, data: followup });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create followup" });
  }
};

export const getFollowUpsByLead = async (req: Request, res: Response) => {
  try {
    const leadId = Number(req.params.leadId);
    const followups = await prisma.followUp.findMany({
      where: { leadId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: followups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

// Global board — used by grid AND table on the Followup menu page
export const getFollowUpBoard = async (req: Request, res: Response) => {
  try {

     res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    const user = (req as any).user;
    const whereClause: any = {};
    if (user?.role === "BRANCH") {
      whereClause.branchId = Number(user.branchId);
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        customer: true,
        model: true,
        showroomVariant: true,
        colour: true,
        executive: true,
        followUps: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    const board: Record<string, any[]> = { Pending: [], Attend: [], Delay: [], Upcoming: [] };

    for (const lead of leads) {
      const latestFollowUp = lead.followUps[0] || null;
      const bucket = computeBucket(lead, latestFollowUp);
      board[bucket].push({ ...lead, latestFollowUp });
    }

    res.json({
      success: true,
      data: board,
      counts: {
        Pending: board.Pending.length,
        Attend: board.Attend.length,
        Delay: board.Delay.length,
        Upcoming: board.Upcoming.length,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to load board" });
  }
};