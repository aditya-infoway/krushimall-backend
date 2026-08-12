import * as CashReceiptController from "../../cashReceipt.js";
export const getcashReceipt = (req, res) => CashReceiptController.getcashReceipt(req, res);
export const getcashReceiptById = (req, res) => CashReceiptController.getcashReceiptById(req, res);
export const createCashReceipt = (req, res) => CashReceiptController.createCashReceipt(req, res);
export const updateCashReceipt = (req, res) => CashReceiptController.updateCashReceipt(req, res);
export const deleteCashReceipt = (req, res) => CashReceiptController.deleteCashReceipt(req, res);
export const getCashReceiptVoucher = (req, res) => CashReceiptController.getCashReceiptVoucher(req, res);
export const exportCashReceiptExcel = (req, res) => CashReceiptController.exportCashReceiptExcel(req, res);
export const printCashReceipt = (req, res) => CashReceiptController.printCashReceipt(req, res);
//# sourceMappingURL=cashReceipt.js.map