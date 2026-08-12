import prisma from "../lib/prisma.js";
import { generateBillNo } from "../utils/generatepurchaseBillNo.js";
import { generateVehicleSerialNo } from "../utils/generateVehicleSerialNo.js";
import { generateCashPaymentVoucher } from "../utils/generateCashPaymentVoucher.js";
import { generateBankPaymentVoucher } from "../utils/generateBankPaymentVoucher.js";
export const createPurchase = async (req, res) => {
    try {
        const { companyId, financialYearId, accountId, purchaseDate, purchaseBillNo, purchaseLocation, dueDate, terms, narration, cashAccountId, bankAccountId, paymentMode, chequeNo, chequeDate, clearDate, bankNarration, freightCharge, insurance, otherCharge, roundAmount, totalQty, totalAmount, cgst, sgst, igst, grandTotal, items, } = req.body;
        // ======================================================
        // CHECK CASH / BANK ACCOUNT BALANCE BEFORE PURCHASE SAVE
        // ======================================================
        const purchaseAmount = Number(grandTotal || 0);
        if (purchaseAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Purchase amount must be greater than zero",
            });
        }
        // CASH PURCHASE BALANCE CHECK
        if (terms?.toLowerCase() === "cash") {
            if (!cashAccountId) {
                return res.status(400).json({
                    success: false,
                    message: "Please select a cash account",
                });
            }
            const cashAccount = await prisma.account.findUnique({
                where: {
                    id: Number(cashAccountId),
                },
                select: {
                    id: true,
                    accountName: true,
                    closingBalance: true,
                    drCr: true,
                },
            });
            if (!cashAccount) {
                return res.status(404).json({
                    success: false,
                    message: "Selected cash account was not found",
                });
            }
            const availableBalance = cashAccount.drCr === "Dr" ? Number(cashAccount.closingBalance || 0) : 0;
            if (availableBalance < purchaseAmount) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient balance in ${cashAccount.accountName}. Available balance: ₹${availableBalance.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}, Purchase amount: ₹${purchaseAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`,
                });
            }
        }
        // BANK PURCHASE BALANCE CHECK
        if (terms?.toLowerCase() === "bank") {
            if (!bankAccountId) {
                return res.status(400).json({
                    success: false,
                    message: "Please select a bank account",
                });
            }
            const bankAccount = await prisma.account.findUnique({
                where: {
                    id: Number(bankAccountId),
                },
                select: {
                    id: true,
                    accountName: true,
                    closingBalance: true,
                    drCr: true,
                },
            });
            if (!bankAccount) {
                return res.status(404).json({
                    success: false,
                    message: "Selected bank account was not found",
                });
            }
            const availableBalance = bankAccount.drCr === "Dr" ? Number(bankAccount.closingBalance || 0) : 0;
            if (availableBalance < purchaseAmount) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient balance in ${bankAccount.accountName}. Available balance: ₹${availableBalance.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}, Purchase amount: ₹${purchaseAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`,
                });
            }
        }
        const billNo = await generateBillNo("PURCHASE", "purchase", Number(companyId), Number(financialYearId));
        const user = req.user;
        const role = user?.role?.toUpperCase().replace(/\s+/g, "_");
        const name = user?.employeeName || user?.name || "Admin";
        const purchase = await prisma.purchase.create({
            data: {
                companyId: Number(companyId),
                financialYearId: Number(financialYearId),
                billNo,
                accountId: Number(accountId),
                purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                purchaseBillNo,
                purchaseLocation,
                createdById: Number(user.id),
                createdBy: user.employeeName || user.name,
                createdType: role,
                dueDate: dueDate ? new Date(dueDate) : null,
                terms,
                narration,
                cashAccountId: cashAccountId ? Number(cashAccountId) : null,
                bankAccountId: bankAccountId ? Number(bankAccountId) : null,
                paymentMode,
                chequeNo,
                chequeDate: chequeDate ? new Date(chequeDate) : null,
                clearDate: clearDate ? new Date(clearDate) : null,
                bankNarration,
                freightCharge: Number(freightCharge || 0),
                insurance: Number(insurance || 0),
                otherCharge: Number(otherCharge || 0),
                roundAmount: Number(roundAmount || 0),
                totalQty: Number(totalQty || 0),
                totalAmount: Number(totalAmount || 0),
                cgst: Number(cgst || 0),
                sgst: Number(sgst || 0),
                igst: Number(igst || 0),
                grandTotal: Number(grandTotal || 0),
                status: "NOT_VERIFY",
                items: {
                    create: items?.map((item) => ({
                        itemName: item.item,
                        itemCode: item.itemCode,
                        shortName: item.shortName || null,
                        hsnCode: item.hsnCode || null,
                        taxSlab: item.taxSlab || null,
                        modelName: item.modelName || null,
                        variantName: item.variantName || null,
                        fuelType: item.typeOfFuel || null,
                        fuelCapacity: item.fuelCapacity || null,
                        color: item.color,
                        chassisNo: item.chassisNo,
                        engineNo: item.engineNo,
                        qty: Number(item.qty),
                        ratePer: Number(item.ratePer),
                        gstPercent: Number(item.gstPercent),
                        amount: Number(item.amount),
                    })) || [],
                },
            },
            include: {
                account: true,
                items: true,
            },
        });
        if (terms?.toLowerCase() === "credit" && accountId) {
            const account = await prisma.account.findUnique({
                where: { id: Number(accountId) },
            });
            if (account) {
                const currentBalance = Number(account.closingBalance || 0);
                const purchaseAmount = Number(grandTotal || 0);
                let closingBalance = currentBalance;
                let balanceType = account.drCr;
                if (balanceType === "Cr") {
                    closingBalance += purchaseAmount;
                }
                else {
                    if (currentBalance >= purchaseAmount) {
                        closingBalance -= purchaseAmount;
                    }
                    else {
                        closingBalance = purchaseAmount - currentBalance;
                        balanceType = "Cr";
                    }
                }
                await prisma.account.update({
                    where: { id: Number(accountId) },
                    data: {
                        closingBalance,
                        drCr: balanceType,
                    },
                });
            }
        }
        else if (terms?.toLowerCase() === "cash" && cashAccountId) {
            const account = await prisma.account.findUnique({
                where: { id: Number(cashAccountId) },
            });
            if (account) {
                const currentBalance = Number(account.closingBalance || 0);
                const purchaseAmount = Number(grandTotal || 0);
                await prisma.account.update({
                    where: {
                        id: Number(cashAccountId),
                    },
                    data: {
                        closingBalance: currentBalance - purchaseAmount,
                        drCr: "Dr",
                    },
                });
            }
            // // Supplier (+)
            // if (accountId) {
            //   const supplier = await prisma.account.findUnique({
            //     where: { id: Number(accountId) },
            //   });
            //   if (supplier) {
            //     const currentBalance = Number(supplier.closingBalance || 0);
            //     const purchaseAmount = Number(grandTotal || 0);
            //     let closingBalance = currentBalance;
            //     let balanceType = supplier.drCr;
            //     if (balanceType === "Cr") {
            //       closingBalance += purchaseAmount;
            //     } else {
            //       if (currentBalance >= purchaseAmount) {
            //         closingBalance -= purchaseAmount;
            //       } else {
            //         closingBalance = purchaseAmount - currentBalance;
            //         balanceType = "Cr";
            //       }
            //     }
            //     await prisma.account.update({
            //       where: { id: Number(accountId) },
            //       data: {
            //         closingBalance,
            //         drCr: balanceType,
            //       },
            //     });
            //   }
            // }
        }
        // BANK PURCHASE
        else if (terms?.toLowerCase() === "bank" && bankAccountId) {
            const account = await prisma.account.findUnique({
                where: { id: Number(bankAccountId) },
            });
            if (account) {
                const currentBalance = Number(account.closingBalance || 0);
                const purchaseAmount = Number(grandTotal || 0);
                await prisma.account.update({
                    where: {
                        id: Number(bankAccountId),
                    },
                    data: {
                        closingBalance: currentBalance - purchaseAmount,
                        drCr: "Dr",
                    },
                });
            }
            // // Supplier (+)
            // if (accountId) {
            //   const supplier = await prisma.account.findUnique({
            //     where: { id: Number(accountId) },
            //   });
            //   if (supplier) {
            //     const currentBalance = Number(supplier.closingBalance || 0);
            //     const purchaseAmount = Number(grandTotal || 0);
            //     let closingBalance = currentBalance;
            //     let balanceType = supplier.drCr;
            //     if (balanceType === "Cr") {
            //       closingBalance += purchaseAmount;
            //     } else {
            //       if (currentBalance >= purchaseAmount) {
            //         closingBalance -= purchaseAmount;
            //       } else {
            //         closingBalance = purchaseAmount - currentBalance;
            //         balanceType = "Cr";
            //       }
            //     }
            //     await prisma.account.update({
            //       where: { id: Number(accountId) },
            //       data: {
            //         closingBalance,
            //         drCr: balanceType,
            //       },
            //     });
            //   }
            // }
        }
        if (terms?.toLowerCase() === "cash" && cashAccountId) {
            const voucherNo = await generateCashPaymentVoucher(Number(companyId), Number(financialYearId));
            await prisma.cashPayment.create({
                data: {
                    companyId: Number(companyId),
                    financialYearId: Number(financialYearId),
                    voucherNo,
                    // Transaction Purchase Cash Payment
                    type: "TPCP",
                    date: purchase.purchaseDate ?? new Date(),
                    cashAccountId: Number(cashAccountId),
                    // Supplier Account
                    oppAccountId: Number(accountId),
                    purchaseId: purchase.id,
                    amount: Number(grandTotal),
                    narration: narration || "",
                    createdBy: name,
                    createdType: role,
                },
            });
        }
        if (terms?.toLowerCase() === "bank" && bankAccountId) {
            const voucherNo = await generateBankPaymentVoucher(Number(companyId), Number(financialYearId));
            await prisma.bankPayment.create({
                data: {
                    companyId: Number(companyId),
                    financialYearId: Number(financialYearId),
                    voucherNo,
                    type: "TPBP",
                    date: purchase.purchaseDate ?? new Date(),
                    bankAccountId: Number(bankAccountId),
                    oppAccountId: Number(accountId),
                    purchaseId: purchase.id,
                    amount: Number(grandTotal),
                    paymentMode: paymentMode || null,
                    chequeNo: chequeNo || null,
                    chequeDate: chequeDate ? new Date(chequeDate) : null,
                    clearDate: clearDate ? new Date(clearDate) : null,
                    narration: narration || "",
                    createdBy: name,
                    createdType: role,
                },
            });
        }
        return res.status(201).json({
            success: true,
            data: purchase,
            message: "Purchase created successfully",
        });
    }
    catch (error) {
        console.error(error);
        if (error.code === "P2002") {
            const originalMessage = error.meta?.driverAdapterError?.cause?.originalMessage || "";
            if (originalMessage.includes("PurchaseItem_chassisNo_key")) {
                return res.status(400).json({
                    success: false,
                    message: "Chassis No already exists",
                });
            }
            if (originalMessage.includes("PurchaseItem_engineNo_key")) {
                return res.status(400).json({
                    success: false,
                    message: "Engine No already exists",
                });
            }
            return res.status(400).json({
                success: false,
                message: "Duplicate value already exists",
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to create purchase",
        });
    }
};
export const updatePurchase = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const purchase = await prisma.purchase.findUnique({
            where: { id },
        });
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase not found",
            });
        }
        const { accountId, purchaseDate, purchaseBillNo, purchaseLocation, dueDate, terms, narration, cashAccountId, bankAccountId, paymentMode, chequeNo, chequeDate, clearDate, bankNarration, freightCharge, insurance, otherCharge, roundAmount, totalQty, totalAmount, cgst, sgst, igst, grandTotal, items, } = req.body;
        await prisma.purchaseItem.deleteMany({
            where: {
                purchaseId: id,
            },
        });
        const updatedPurchase = await prisma.purchase.update({
            where: { id },
            data: {
                accountId: Number(accountId),
                purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                purchaseBillNo,
                purchaseLocation,
                dueDate: dueDate ? new Date(dueDate) : null,
                terms,
                narration,
                cashAccountId: cashAccountId ? Number(cashAccountId) : null,
                bankAccountId: bankAccountId ? Number(bankAccountId) : null,
                paymentMode,
                chequeNo,
                chequeDate: chequeDate ? new Date(chequeDate) : null,
                clearDate: clearDate ? new Date(clearDate) : null,
                bankNarration,
                freightCharge: Number(freightCharge || 0),
                insurance: Number(insurance || 0),
                otherCharge: Number(otherCharge || 0),
                roundAmount: Number(roundAmount || 0),
                totalQty: Number(totalQty || 0),
                totalAmount: Number(totalAmount || 0),
                cgst: Number(cgst || 0),
                sgst: Number(sgst || 0),
                igst: Number(igst || 0),
                grandTotal: Number(grandTotal || 0),
                items: {
                    create: items.map((item) => ({
                        itemName: item.item,
                        itemCode: item.itemCode,
                        shortName: item.shortName || null,
                        hsnCode: item.hsnCode || null,
                        taxSlab: item.taxSlab || null,
                        modelName: item.modelName || null,
                        variantName: item.variantName || null,
                        fuelType: item.typeOfFuel || null,
                        fuelCapacity: item.fuelCapacity || null,
                        color: item.color,
                        chassisNo: item.chassisNo,
                        engineNo: item.engineNo,
                        qty: Number(item.qty),
                        ratePer: Number(item.ratePer),
                        gstPercent: Number(item.gstPercent),
                        amount: Number(item.amount),
                    })),
                },
            },
            include: {
                account: true,
                items: true,
            },
        });
        return res.json({
            success: true,
            data: updatedPurchase,
            message: "Purchase updated successfully",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Update failed",
        });
    }
};
export const verifyPurchase = async (req, res) => {
    try {
        await prisma.purchase.update({
            where: {
                id: Number(req.params.id),
            },
            data: {
                status: "VERIFY",
            },
        });
        return res.json({
            success: true,
            message: "Purchase verified successfully",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Verification failed",
        });
    }
};
export const getPurchases = async (req, res) => {
    try {
        const purchases = await prisma.purchase.findMany({
            include: {
                account: true,
                items: true,
                employee: {
                    select: {
                        id: true,
                        employeeName: true,
                    },
                },
            },
            orderBy: {
                id: "desc",
            },
        });
        const data = purchases.map((purchase) => {
            const totalItems = purchase.items.length;
            const inwardItems = purchase.items.filter((item) => item.status === "Inward").length;
            const hasBookedItem = purchase.items.some((item) => item.status === "Booked");
            return {
                ...purchase,
                createdBy: purchase.createdBy,
                verified: purchase.status === "VERIFY",
                allInward: totalItems > 0 && totalItems === inwardItems,
                hasBookedItem,
            };
        });
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch purchases",
        });
    }
};
export const getPendingPurchasesForCashPayment = async (req, res) => {
    try {
        const purchases = await prisma.purchase.findMany({
            where: {
                terms: {
                    equals: "Credit",
                    mode: "insensitive",
                },
            },
            include: {
                account: true,
                cashPayments: true,
                bankPayments: true,
            },
            orderBy: {
                id: "desc",
            },
        });
        const data = purchases
            .map((purchase) => {
            const paidAmount = purchase.cashPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0) +
                purchase.bankPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
            const grandTotal = Number(purchase.grandTotal || 0);
            const pendingAmount = Math.max(grandTotal - paidAmount, 0);
            return {
                ...purchase,
                paidAmount,
                pendingAmount,
            };
        })
            .filter((purchase) => purchase.pendingAmount > 0);
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch pending purchases",
        });
    }
};
export const getPurchaseById = async (req, res) => {
    try {
        const purchase = await prisma.purchase.findUnique({
            where: {
                id: Number(req.params.id),
            },
            include: {
                account: true,
                items: true,
                employee: {
                    select: {
                        id: true,
                        employeeName: true,
                    },
                },
            },
        });
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: {
                ...purchase,
                createdBy: purchase.createdBy,
                transportSaved: !!purchase.transporterName &&
                    !!purchase.mobileNumber &&
                    !!purchase.vehicleNumber,
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch purchase",
        });
    }
};
export const deletePurchase = async (req, res) => {
    try {
        await prisma.purchase.delete({
            where: {
                id: Number(req.params.id),
            },
        });
        return res.status(200).json({
            success: true,
            message: "Purchase deleted successfully",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete purchase",
        });
    }
};
export const getPurchaseBillNo = async (req, res) => {
    try {
        const { companyId, financialYearId } = req.query;
        const billNo = await generateBillNo("PURCHASE", "purchase", Number(companyId), Number(financialYearId));
        return res.status(200).json({ success: true, billNo });
    }
    catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ success: false, message: "Failed to generate bill no" });
    }
};
export const submitPurchaseItemInward = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const user = req.user;
        const role = user?.role?.toUpperCase().replace(/\s+/g, "_");
        const name = user?.employeeName || user?.name;
        const { vehicleSrNo, mfgDate, keyNo, batteryMake, batteryNo, first1TyerNo, first2TyerNo, second1TyerNo, second2TyerNo, location, grnNumber, grnDate, grnRecordDate, } = req.body;
        const item = await prisma.purchaseItem.update({
            where: { id },
            data: {
                vehicleSrNo,
                mfgDate: mfgDate ? new Date(mfgDate) : null,
                keyNo,
                batteryMake,
                batteryNo,
                first1TyerNo,
                first2TyerNo,
                second1TyerNo,
                second2TyerNo,
                location,
                grnNumber,
                grnDate: grnDate ? new Date(grnDate) : null,
                grnRecordDate: grnRecordDate ? new Date(grnRecordDate) : null,
                status: "Inward",
                createdById: Number(user.id),
                createdBy: name,
                createdType: role,
            },
        });
        return res.json({
            success: true,
            data: item,
            message: "Inward saved successfully",
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Failed",
        });
    }
};
export const getVehicleSerialNo = async (req, res) => {
    try {
        const vehicleSrNo = await generateVehicleSerialNo();
        return res.json({
            success: true,
            vehicleSrNo,
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Failed to generate Vehicle Serial No.",
        });
    }
};
export const saveTransport = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { transporterName, mobileNumber, vehicleNumber } = req.body;
        const purchase = await prisma.purchase.update({
            where: { id },
            data: {
                transporterName,
                mobileNumber,
                vehicleNumber,
            },
        });
        return res.json({
            success: true,
            data: purchase,
            message: "Transport details saved successfully",
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to save transport details",
        });
    }
};
export const getTransport = async (req, res) => {
    try {
        const purchase = await prisma.purchase.findUnique({
            where: {
                id: Number(req.params.id),
            },
            select: {
                transporterName: true,
                mobileNumber: true,
                vehicleNumber: true,
            },
        });
        return res.json({
            success: true,
            data: purchase,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
        });
    }
};
export const getTractorInventory = async (req, res) => {
    try {
        const purchases = await prisma.purchase.findMany({
            where: {
                status: "VERIFY",
            },
            include: {
                account: true,
                items: {
                    include: {
                        tractor: true,
                    },
                },
            },
            orderBy: {
                id: "desc",
            },
        });
        const tractors = await prisma.tractor.findMany({
            select: {
                codeNo: true,
                purchasePriceNoGST: true,
                purchasePriceTaxable: true,
            },
        });
        const tractorMap = new Map(tractors.map((t) => [t.codeNo, t]));
        const data = purchases.flatMap((purchase) => purchase.items.map((item) => {
            const tractor = tractorMap.get(String(item.itemCode));
            const inwardDate = item.grnRecordDate;
            const ageDay = inwardDate
                ? Math.floor((new Date().getTime() - new Date(inwardDate).getTime()) /
                    (1000 * 60 * 60 * 24))
                : 0;
            return {
                id: item.id,
                stock: "On",
                status: item.status === "Booked"
                    ? "Booked"
                    : item.status === "Inward"
                        ? "Present"
                        : "In Transit",
                location: purchase.purchaseLocation || "",
                currentLocation: purchase.purchaseLocation || "",
                billNo: purchase.billNo,
                purchaseBillNo: purchase.purchaseBillNo,
                supplierName: purchase.account?.accountName || "",
                itemName: item.itemName,
                itemCode: item.itemCode,
                model: item.modelName,
                variant: item.variantName,
                colour: item.color,
                fuelType: item.fuelType,
                serialNo: item.vehicleSrNo,
                mfgDate: item.mfgDate,
                chassisNo: item.chassisNo,
                engineNo: item.engineNo,
                keyNumber: item.keyNo,
                batteryMake: item.batteryMake,
                batteryNo: item.batteryNo,
                first1Tyer: item.first1TyerNo,
                first2Tyer: item.first2TyerNo,
                second1Tyer: item.second1TyerNo,
                second2Tyer: item.second2TyerNo,
                grnDate: item.grnDate,
                grnRecordDate: item.grnRecordDate,
                grnNo: item.grnNumber,
                inWardDate: item.grnRecordDate,
                inWardTime: item.updatedAt,
                purchasePriceNoGST: tractor?.purchasePriceNoGST ?? 0,
                purchasePriceTaxable: tractor?.purchasePriceTaxable ?? 0,
                ageDay, // <-- Add this
            };
        }));
        return res.json({
            success: true,
            data,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed",
        });
    }
};
export const getModelWiseInventoryAnalysis = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        const dateFilter = {};
        if (fromDate)
            dateFilter.gte = new Date(String(fromDate));
        if (toDate) {
            const end = new Date(String(toDate));
            end.setHours(23, 59, 59, 999);
            dateFilter.lte = end;
        }
        const purchases = await prisma.purchase.findMany({
            where: {
                status: "VERIFY",
                ...(Object.keys(dateFilter).length > 0 && { purchaseDate: dateFilter }), // ✅ createdAt → purchaseDate
            },
            include: { items: true },
        });
        // ==========================================
        // MODEL WISE GROUPING
        // ==========================================
        const modelMap = new Map();
        purchases.forEach((purchase) => {
            purchase.items.forEach((item) => {
                const modelName = item.modelName || "Unknown";
                if (!modelMap.has(modelName)) {
                    modelMap.set(modelName, {
                        model: modelName,
                        present: 0,
                        transit: 0,
                        purchase: 0,
                        sales: 0,
                    });
                }
                const entry = modelMap.get(modelName);
                // Purchase = model ke total items (kharide gaye)
                entry.purchase += 1;
                if (item.status === "Inward") {
                    entry.present += 1;
                }
                else if (item.status === "Booked") {
                    entry.sales += 1; // Booked = sold
                }
                else {
                    entry.transit += 1; // baaki sab In Transit
                }
            });
        });
        const modelAnalysis = Array.from(modelMap.values());
        // ==========================================
        // PIE CHART — MODEL WISE TOTAL STOCK DISTRIBUTION
        // Har model ka total (present + transit + sales) ek slice
        // ==========================================
        const pieData = modelAnalysis.map((row) => ({
            name: row.model,
            value: row.present + row.transit + row.sales,
        }));
        return res.json({
            success: true,
            data: {
                modelAnalysis,
                pieData,
            },
        });
    }
    catch (error) {
        console.error("GET MODEL WISE INVENTORY ANALYSIS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch model wise inventory analysis",
        });
    }
};
export const getInventoryDetails = async (req, res) => {
    try {
        // ==========================================
        // 1) PURCHASE ORDERS — Present/Transit yahin se
        // ==========================================
        const { fromDate, toDate } = req.query;
        const dateFilter = {};
        if (fromDate)
            dateFilter.gte = new Date(String(fromDate));
        if (toDate) {
            const end = new Date(String(toDate));
            end.setHours(23, 59, 59, 999);
            dateFilter.lte = end;
        }
        const purchases = await prisma.purchase.findMany({
            where: {
                status: "VERIFY",
                ...(Object.keys(dateFilter).length > 0 && { purchaseDate: dateFilter }), // ✅ createdAt → purchaseDate
            },
            include: { items: true },
            orderBy: { id: "asc" },
        });
        const leads = await prisma.lead.findMany({
            where: {
                ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }), // Lead ke liye createdAt theek hai
            },
            include: {
                model: { select: { modelName: true } },
                order: { select: { id: true } },
            },
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const hotCountByModel = new Map();
        const bookedCountByModel = new Map();
        leads.forEach((lead) => {
            const modelName = lead.model?.modelName || "Unknown";
            let leadTemperature = "Cold";
            if (lead.expectedPurchaseDate) {
                const expectedDate = new Date(lead.expectedPurchaseDate);
                expectedDate.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays <= 7)
                    leadTemperature = "Hot";
            }
            if (leadTemperature === "Hot") {
                hotCountByModel.set(modelName, (hotCountByModel.get(modelName) || 0) + 1);
            }
            // Order ban chuka hai matlab lead booked ho chuka hai
            if (lead.order) {
                bookedCountByModel.set(modelName, (bookedCountByModel.get(modelName) || 0) + 1);
            }
        });
        // ==========================================
        // 3) EK ROW PER PURCHASE ORDER
        // ==========================================
        const data = purchases.map((purchase, index) => {
            const firstItem = purchase.items[0];
            const modelName = firstItem?.modelName || "-";
            const variantName = firstItem?.variantName || "-";
            const colour = firstItem?.color || "-";
            const present = purchase.items.filter((i) => i.status === "Inward").length;
            const bookedItems = purchase.items.filter((i) => i.status === "Booked").length;
            const transit = purchase.items.length - present - bookedItems;
            return {
                srNo: index + 1,
                model: modelName,
                variant: variantName,
                colour,
                purchaseOrder: purchase.billNo,
                present,
                transit,
                hot: hotCountByModel.get(modelName) || 0,
                booked: bookedCountByModel.get(modelName) || 0,
                lost: null, // ⚠️ abhi track nahi hota, isliye "-" dikhega
            };
        });
        return res.json({
            success: true,
            data,
        });
    }
    catch (error) {
        console.error("GET INVENTORY DETAILS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch inventory details",
        });
    }
};
//# sourceMappingURL=purchase.js.map