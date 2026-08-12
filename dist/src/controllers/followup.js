import prisma from "../lib/prisma.js";
function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}
function startOfMonth(d) {
    const x = new Date(d.getFullYear(), d.getMonth(), 1);
    x.setHours(0, 0, 0, 0);
    return x;
}
// Mirrors the same Hot/Warm/Cold thresholds used in getLeads (lead.ts)
function computeLeadTemperature(lead) {
    if (!lead.expectedPurchaseDate)
        return "Cold";
    const today = startOfDay(new Date());
    const expectedDate = startOfDay(new Date(lead.expectedPurchaseDate));
    const diffDays = Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7)
        return "Hot";
    if (diffDays <= 15)
        return "Warm";
    return "Cold";
}
// returns null when the lead shouldn't appear on the board at all
function computeBucket(lead, latestFollowUp, leadTemperature) {
    const today = startOfDay(new Date());
    const monthStart = startOfMonth(today);
    // Acted on today takes priority over everything else —
    // a Delay or Pending lead that just got contacted today becomes Attend.
    if (latestFollowUp &&
        startOfDay(new Date(latestFollowUp.createdAt)).getTime() === today.getTime()) {
        return "Attend";
    }
    const refDateRaw = latestFollowUp?.nextScheduledDate || lead.followUpDate;
    if (!refDateRaw)
        return "Pending"; // never contacted, no date set yet
    const refDay = startOfDay(new Date(refDateRaw));
    // Due today, not yet logged today
    if (refDay.getTime() === today.getTime()) {
        return "Pending";
    }
    // Overdue
    if (refDay.getTime() < today.getTime()) {
        if (refDay.getTime() >= monthStart.getTime()) {
            return "Delay"; // overdue, but within this calendar month
        }
        return null; // overdue from a previous month — drops off the board
    }
    // Future
    const sevenDaysOut = new Date(today);
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
    if (refDay.getTime() <= sevenDaysOut.getTime() && leadTemperature === "Hot") {
        return "Upcoming"; // due within next 7 days AND lead is Hot
    }
    return null; // future, but doesn't qualify for Upcoming
}
export const createFollowUp = async (req, res) => {
    try {
        const { leadId, expectedPurchaseDate, nextScheduledDate, callTime, callResponse, discussion } = req.body;
        if (!leadId) {
            return res.status(400).json({ success: false, message: "leadId is required" });
        }
        const user = req.user;
        // Lead ka branchId nikalo — sabse reliable source, kyunki Branch role ke alawa
        // Admin/Sales Executive bhi followup create kar sakte hain
        const lead = await prisma.lead.findUnique({
            where: { id: Number(leadId) },
            select: { branchId: true },
        });
        if (!lead) {
            return res.status(404).json({ success: false, message: "Lead not found" });
        }
        const count = await prisma.followUp.count({ where: { leadId: Number(leadId) } });
        const followup = await prisma.followUp.create({
            data: {
                leadId: Number(leadId),
                branchId: lead.branchId, // ✅ Lead se copy — snapshot ke liye
                expectedPurchaseDate: expectedPurchaseDate ? new Date(expectedPurchaseDate) : null,
                nextScheduledDate: nextScheduledDate ? new Date(nextScheduledDate) : null,
                callTime,
                callResponse,
                discussion,
                followupCount: count + 1,
                createdType: req.body.createdType || user?.role || null,
                createdBy: req.body.createdBy || user?.employeeName || user?.name || null,
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to create followup" });
    }
};
export const getFollowUpsByLead = async (req, res) => {
    try {
        const leadId = Number(req.params.leadId);
        const followups = await prisma.followUp.findMany({
            where: { leadId },
            orderBy: { createdAt: "desc" },
        });
        const user = req.user;
        const whereClause = {
            id: leadId,
        };
        if (user?.role?.toUpperCase() === "BRANCH") {
            whereClause.branchId = Number(user.branchId);
        }
        if (user?.role?.toUpperCase() === "SALES EXECUTIVE") {
            whereClause.executiveId = Number(user.id);
        }
        const lead = await prisma.lead.findFirst({
            where: whereClause,
            include: {
                customer: true,
                executive: true,
                company: true,
                branch: true,
            },
        });
        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }
        res.json({ success: true, data: followups, lead });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
};
export const getLatestFollowUpByLead = async (req, res) => {
    try {
        const leadId = Number(req.params.leadId);
        const followups = await prisma.followUp.findMany({
            where: { leadId },
            orderBy: { createdAt: "desc" },
            take: 1,
        });
        const user = req.user;
        const whereClause = {
            id: leadId,
        };
        if (user?.role?.toUpperCase() === "BRANCH") {
            whereClause.branchId = Number(user.branchId);
        }
        if (user?.role?.toUpperCase() === "SALES EXECUTIVE") {
            whereClause.executiveId = Number(user.id);
        }
        const lead = await prisma.lead.findFirst({
            where: whereClause,
            include: {
                customer: true,
                executive: true,
                company: true,
                branch: true,
            },
        });
        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }
        res.json({
            success: true,
            data: followups,
            lead,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
        });
    }
};
// Global board — used by grid AND table on the Followup menu page
export const getFollowUpBoard = async (req, res) => {
    try {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
        const user = req.user;
        const whereClause = {};
        if (user?.role === "BRANCH") {
            whereClause.branchId = Number(user.branchId);
        }
        if (user?.role?.toUpperCase() === "SALES EXECUTIVE") {
            whereClause.executiveId = Number(user.id);
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
        const board = { Pending: [], Attend: [], Delay: [], Upcoming: [] };
        for (const lead of leads) {
            const latestFollowUp = lead.followUps[0] || null;
            const leadTemperature = computeLeadTemperature(lead);
            const bucket = computeBucket(lead, latestFollowUp, leadTemperature);
            if (!bucket)
                continue; // excluded from the board entirely
            board[bucket].push({ ...lead, latestFollowUp, leadTemperature });
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to load board" });
    }
};
//# sourceMappingURL=followup.js.map