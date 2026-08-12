import * as LeadController from "../../lead.js";
export const createLead = async (req, res) => {
    try {
        const user = req.user;
        // Sales Executive specific values
        req.body.createdType = user.role?.toUpperCase().replace(/\s+/g, "_");
        req.body.createdBy = user?.employeeName || user?.name;
        req.body.executiveId = user?.id;
        return LeadController.createLead(req, res);
    }
    catch (error) {
        console.error("Sales Executive Create Lead Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create lead",
        });
    }
};
export const getLeads = async (req, res) => {
    return LeadController.getLeads(req, res);
};
export const getLeadsForCashReceipt = async (req, res) => {
    return LeadController.getLeadsForCashReceipt(req, res);
};
export const getLeadById = async (req, res) => {
    return LeadController.getLeadById(req, res);
};
export const updateQuotation = async (req, res) => {
    try {
        const user = req.user;
        // Override values for Sales Executive
        req.body.createdType = "SALES_EXECUTIVE";
        req.body.createdBy = user?.employeeName || user?.name;
        return LeadController.updateQuotation(req, res);
    }
    catch (error) {
        console.error("Sales Executive Update Quotation Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update quotation",
        });
    }
};
export const generateOrderBillPdf = async (req, res) => {
    return LeadController.generateOrderBillPdf(req, res);
};
export const getQuotationHistoryList = async (req, res) => {
    return LeadController.getQuotationHistoryList(req, res);
};
export const getQuotationHistoryByLeadId = async (req, res) => {
    return LeadController.getQuotationHistoryByLeadId(req, res);
};
export const getBookingBalance = async (req, res) => {
    return LeadController.getBookingBalance(req, res);
};
//# sourceMappingURL=lead.js.map