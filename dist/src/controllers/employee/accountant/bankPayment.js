import * as BankPaymentController from "../../bankPayment.js";
export const getBankPayments = (req, res) => BankPaymentController.getBankPayments(req, res);
export const getBankPaymentById = (req, res) => BankPaymentController.getBankPaymentById(req, res);
export const createBankPayment = (req, res) => BankPaymentController.createBankPayment(req, res);
export const updateBankPayment = (req, res) => BankPaymentController.updateBankPayment(req, res);
export const deleteBankPayment = (req, res) => BankPaymentController.deleteBankPayment(req, res);
export const getBankPaymentVoucher = (req, res) => BankPaymentController.getBankPaymentVoucher(req, res);
export const exportBankPaymentExcel = (req, res) => BankPaymentController.exportBankPaymentExcel(req, res);
//# sourceMappingURL=bankPayment.js.map