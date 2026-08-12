import * as CashPaymentController from "../../cashPayment.js";
export const getCashPayments = (req, res) => CashPaymentController.getCashPayments(req, res);
export const getCashPaymentById = (req, res) => CashPaymentController.getCashPaymentById(req, res);
export const createCashPayment = (req, res) => CashPaymentController.createCashPayment(req, res);
export const updateCashPayment = (req, res) => CashPaymentController.updateCashPayment(req, res);
export const deleteCashPayment = (req, res) => CashPaymentController.deleteCashPayment(req, res);
export const getCashPaymentVoucher = (req, res) => CashPaymentController.getCashPaymentVoucher(req, res);
export const exportCashPaymentExcel = (req, res) => CashPaymentController.exportCashPaymentExcel(req, res);
//# sourceMappingURL=cashPayment.js.map