import * as PurchaseController from "../../purchase.js";
export const createPurchase = async (req, res) => {
    const user = req.user;
    req.body.createdType = user.role?.toUpperCase().replace(/\s+/g, "_");
    req.body.createdBy = user.employeeName || user.name;
    req.body.createdById = user.id;
    return PurchaseController.createPurchase(req, res);
};
export const updatePurchase = PurchaseController.updatePurchase;
export const getPurchases = PurchaseController.getPurchases;
export const getPendingPurchasesForCashPayment = PurchaseController.getPendingPurchasesForCashPayment;
export const getPurchaseById = PurchaseController.getPurchaseById;
export const deletePurchase = PurchaseController.deletePurchase;
export const verifyPurchase = PurchaseController.verifyPurchase;
export const getPurchaseBillNo = PurchaseController.getPurchaseBillNo;
export const submitPurchaseItemInward = PurchaseController.submitPurchaseItemInward;
export const getVehicleSerialNo = PurchaseController.getVehicleSerialNo;
export const saveTransport = PurchaseController.saveTransport;
export const getTransport = PurchaseController.getTransport;
export const getTractorInventory = PurchaseController.getTractorInventory;
//# sourceMappingURL=purchase.js.map