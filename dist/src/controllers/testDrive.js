import prisma from "../lib/prisma.js";
export const createTestDrive = async (req, res) => {
    try {
        const { leadId, modelId, showroomVariantId, colourId, testDriveDate, testDriveFromTime, testDriveToTime, duration, vehicleSpeedometerRunning, licenceNo, feedback, remarks, placeOfTestDrive, } = req.body;
        const user = req.user;
        const role = user?.role?.toUpperCase().replace(/\s+/g, "_");
        const name = user?.employeeName || user?.name || "Admin";
        // Get Lead Branch + TeamLead (fallback source for Admin/Branch created test drives)
        const lead = await prisma.lead.findUnique({
            where: {
                id: Number(leadId),
            },
            select: {
                branchId: true,
                teamLeadId: true,
            },
        });
        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }
        // ==========================================
        // GET LOGGED-IN EMPLOYEE (needed to resolve
        // Sales Executive -> assigned Team Lead)
        // ==========================================
        let employee = null;
        if (user?.id) {
            employee = await prisma.employee.findUnique({
                where: {
                    id: Number(user.id),
                },
                select: {
                    id: true,
                    teamLeadId: true,
                },
            });
        }
        // ==========================================
        // DETERMINE TEAM LEAD
        // Team Lead creates      -> his own id
        // Sales Executive creates -> his assigned teamLeadId
        // Admin / Branch creates  -> fallback to Lead's teamLeadId
        // ==========================================
        let finalTeamLeadId = null;
        if (role === "TEAM_LEAD") {
            finalTeamLeadId = employee?.id ?? Number(user.id);
        }
        else if (role === "SALES_EXECUTIVE") {
            finalTeamLeadId = employee?.teamLeadId
                ? Number(employee.teamLeadId)
                : (lead.teamLeadId ?? null);
        }
        else {
            // Admin / Branch panel
            finalTeamLeadId = lead.teamLeadId ?? null;
        }
        // Branch users -> own branch
        // Admin -> Lead's branch
        const finalBranchId = user?.branchId
            ? Number(user.branchId)
            : lead.branchId;
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
                branchId: finalBranchId,
                teamLeadId: finalTeamLeadId,
            },
            include: {
                lead: true,
                model: true,
                showroomVariant: true,
                colour: true,
                branch: true,
            },
        });
        return res.status(201).json({
            success: true,
            message: "Test Drive created successfully",
            data: testDrive,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create Test Drive",
        });
    }
};
export const getTestDrives = async (req, res) => {
    try {
        const user = req.user;
        const role = user?.role?.toUpperCase().replace(/\s+/g, "_");
        const whereClause = {};
        if (role === "TEAM_LEAD") {
            // Team Lead sees only test drives under his team
            whereClause.teamLeadId = Number(user.id);
        }
        else if (role === "SALES_EXECUTIVE") {
            // Sales Executive sees only test drives he created
            whereClause.createdById = Number(user.id);
        }
        else if (user?.branchId) {
            // Branch panel -> own branch only
            whereClause.branchId = Number(user.branchId);
        }
        // Admin -> no filter, sees everything
        const testDrives = await prisma.testDrive.findMany({
            where: whereClause,
            include: {
                lead: true,
                model: true,
                showroomVariant: true,
                colour: true,
                branch: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.json({
            success: true,
            data: testDrives,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch Test Drives",
        });
    }
};
export const getTestDriveById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const user = req.user;
        const role = user?.role?.toUpperCase().replace(/\s+/g, "_");
        const whereClause = {
            id,
        };
        if (role === "TEAM_LEAD") {
            whereClause.teamLeadId = Number(user.id);
        }
        else if (role === "SALES_EXECUTIVE") {
            whereClause.createdById = Number(user.id);
        }
        else if (user?.branchId) {
            whereClause.branchId = Number(user.branchId);
        }
        const testDrive = await prisma.testDrive.findFirst({
            where: whereClause,
            include: {
                lead: true,
                model: true,
                showroomVariant: true,
                colour: true,
                branch: true,
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
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch Test Drive",
        });
    }
};
export const updateTestDrive = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { leadId, modelId, showroomVariantId, colourId, testDriveDate, testDriveFromTime, testDriveToTime, duration, vehicleSpeedometerRunning, licenceNo, feedback, remarks, placeOfTestDrive, } = req.body;
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
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to update",
        });
    }
};
export const deleteTestDrive = async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.testDrive.delete({
            where: { id },
        });
        return res.json({
            success: true,
            message: "Deleted Successfully",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to delete",
        });
    }
};
export const getTestDriveHistory = async (req, res) => {
    try {
        const user = req.user;
        const role = user?.role?.toUpperCase().replace(/\s+/g, "_");
        const whereClause = {};
        if (role === "TEAM_LEAD") {
            whereClause.teamLeadId = Number(user.id);
        }
        else if (role === "SALES_EXECUTIVE") {
            whereClause.createdById = Number(user.id);
        }
        else if (user?.branchId) {
            whereClause.branchId = Number(user.branchId);
        }
        const history = await prisma.testDrive.groupBy({
            by: ["leadId"],
            where: Object.keys(whereClause).length ? whereClause : undefined,
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
        const result = await Promise.all(history.map(async (item) => {
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
        }));
        return res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch Test Drive History",
        });
    }
};
export const getTestDriveHistoryByLead = async (req, res) => {
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
                branch: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.json({
            success: true,
            data: history,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch Test Drive History Details",
        });
    }
};
//# sourceMappingURL=testDrive.js.map