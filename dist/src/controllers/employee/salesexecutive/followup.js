import * as FollowUpController from "../../followup.js";
export const createFollowUp = async (req, res) => {
    try {
        const user = req.user;
        req.body.createdType = user.role?.toUpperCase().replace(/\s+/g, "_");
        req.body.createdBy = user?.employeeName || user?.name;
        return FollowUpController.createFollowUp(req, res);
    }
    catch (error) {
        console.error("Sales Executive Create FollowUp Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create follow up",
        });
    }
};
export const getFollowUpsByLead = FollowUpController.getFollowUpsByLead;
export const getLatestFollowUpByLead = FollowUpController.getLatestFollowUpByLead;
export const getFollowUpBoard = FollowUpController.getFollowUpBoard;
//# sourceMappingURL=followup.js.map