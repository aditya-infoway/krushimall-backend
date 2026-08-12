import * as BankReceiptController from "../../bankReceipt.js";
export const getBankReceipt = (req, res) => BankReceiptController.getBankReceipt(req, res);
export const getBankReceiptById = (req, res) => BankReceiptController.getBankReceiptById(req, res);
export const createBankReceipt = (req, res) => BankReceiptController.createBankReceipt(req, res);
export const updateBankReceipt = (req, res) => BankReceiptController.updateBankReceipt(req, res);
export const deleteBankReceipt = (req, res) => BankReceiptController.deleteBankReceipt(req, res);
export const getBankReceiptVoucher = (req, res) => BankReceiptController.getBankReceiptVoucher(req, res);
export const exportBankReceiptExcel = (req, res) => BankReceiptController.exportBankReceiptExcel(req, res);
export const printBankReceipt = (req, res) => BankReceiptController.printBankReceipt(req, res);
//# sourceMappingURL=bankReceipt.js.map