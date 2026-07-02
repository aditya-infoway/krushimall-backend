import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { generateBillNo } from "../utils/generatepurchaseBillNo.js";
import { generateVehicleSerialNo } from "../utils/generateVehicleSerialNo.js";


export const createPurchase = async (req: Request, res: Response) => {
  try {
    const {
      accountId,
      purchaseDate,
      purchaseBillNo,
      purchaseLocation,
      dueDate,
      terms,
      narration,
        cashAccountId,
      bankAccountId,
  paymentMode,
  chequeNo,
  chequeDate,
  clearDate,
  bankNarration,
      freightCharge,
      insurance,
      otherCharge,
      roundAmount,
      totalQty,
      totalAmount,
      cgst,
      sgst,
      igst,
      grandTotal,
      items,
    } = req.body;

    const billNo = await generateBillNo("PURCHASE", "purchase");

    const purchase = await prisma.purchase.create({
      data: {
        billNo,
        accountId: Number(accountId),
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseBillNo,
        purchaseLocation,

        dueDate: dueDate ? new Date(dueDate) : null,
        terms,
        narration,
         cashAccountId: cashAccountId
    ? Number(cashAccountId)
    : null,
bankAccountId: bankAccountId
  ? Number(bankAccountId)
  : null,

paymentMode,

chequeNo,

chequeDate: chequeDate
  ? new Date(chequeDate)
  : null,

clearDate: clearDate
  ? new Date(clearDate)
  : null,

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
          create:
            items?.map((item: any) => ({
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
        } else {
          if (currentBalance >= purchaseAmount) {
            closingBalance -= purchaseAmount;
          } else {
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

    let closingBalance = currentBalance;
    let balanceType = account.drCr;

    // Cash Account (-)
    if (balanceType === "Dr") {
      if (currentBalance >= purchaseAmount) {
        closingBalance = currentBalance - purchaseAmount;
      } else {
        closingBalance = purchaseAmount - currentBalance;
        balanceType = "Cr";
      }
    } else {
      closingBalance = currentBalance + purchaseAmount;
    }

    await prisma.account.update({
      where: { id: Number(cashAccountId) },
      data: {
        closingBalance,
        drCr: balanceType,
      },
    });
  }

  // Supplier (+)
  if (accountId) {
    const supplier = await prisma.account.findUnique({
      where: { id: Number(accountId) },
    });

    if (supplier) {
      const currentBalance = Number(supplier.closingBalance || 0);
      const purchaseAmount = Number(grandTotal || 0);

      let closingBalance = currentBalance;
      let balanceType = supplier.drCr;

      if (balanceType === "Cr") {
        closingBalance += purchaseAmount;
      } else {
        if (currentBalance >= purchaseAmount) {
          closingBalance -= purchaseAmount;
        } else {
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
}

// BANK PURCHASE
else if (terms?.toLowerCase() === "bank" && bankAccountId) {
  const account = await prisma.account.findUnique({
    where: { id: Number(bankAccountId) },
  });

  if (account) {
    const currentBalance = Number(account.closingBalance || 0);
    const purchaseAmount = Number(grandTotal || 0);

    let closingBalance = currentBalance;
    let balanceType = account.drCr;

    // Bank Account (-)
    if (balanceType === "Dr") {
      if (currentBalance >= purchaseAmount) {
        closingBalance = currentBalance - purchaseAmount;
      } else {
        closingBalance = purchaseAmount - currentBalance;
        balanceType = "Cr";
      }
    } else {
      closingBalance = currentBalance + purchaseAmount;
    }

    await prisma.account.update({
      where: { id: Number(bankAccountId) },
      data: {
        closingBalance,
        drCr: balanceType,
      },
    });
  }

  // Supplier (+)
  if (accountId) {
    const supplier = await prisma.account.findUnique({
      where: { id: Number(accountId) },
    });

    if (supplier) {
      const currentBalance = Number(supplier.closingBalance || 0);
      const purchaseAmount = Number(grandTotal || 0);

      let closingBalance = currentBalance;
      let balanceType = supplier.drCr;

      if (balanceType === "Cr") {
        closingBalance += purchaseAmount;
      } else {
        if (currentBalance >= purchaseAmount) {
          closingBalance -= purchaseAmount;
        } else {
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
}
    return res.status(201).json({
      success: true,
      data: purchase,
      message: "Purchase created successfully",
    });
  } catch (error: any) {
    console.error(error);

    if (error.code === "P2002") {
      const originalMessage =
        error.meta?.driverAdapterError?.cause?.originalMessage || "";

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
export const updatePurchase = async (req: Request, res: Response) => {
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

    const {
      accountId,
      purchaseDate,
      purchaseBillNo,
      purchaseLocation,
      dueDate,
      terms,
      narration,
         cashAccountId,
  bankAccountId,
  paymentMode,
  chequeNo,
  chequeDate,
  clearDate,
  bankNarration,
      freightCharge,
      insurance,
      otherCharge,
      roundAmount,
      totalQty,
      totalAmount,
      cgst,
      sgst,
      igst,
      grandTotal,
      items,
    } = req.body;

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
          cashAccountId: cashAccountId
    ? Number(cashAccountId)
    : null,
bankAccountId: bankAccountId
  ? Number(bankAccountId)
  : null,

paymentMode,

chequeNo,

chequeDate: chequeDate
  ? new Date(chequeDate)
  : null,

clearDate: clearDate
  ? new Date(clearDate)
  : null,

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
          create: items.map((item: any) => ({
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
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};
export const verifyPurchase = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
};
export const getPurchases = async (req: Request, res: Response) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        account: true,
        items: true,
      },
      orderBy: {
        id: "desc",
      },
    });
const data = purchases.map((purchase) => {
  const totalItems = purchase.items.length;

  const inwardItems = purchase.items.filter(
    (item) => item.status === "Inward"
  ).length;

  return {
    ...purchase,
    verified: purchase.status === "VERIFY",
    allInward:
      totalItems > 0 && totalItems === inwardItems,
  };
});

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchases",
    });
  }
};
export const getPurchaseById = async (
  req: Request,
  res: Response
) => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        account: true,
        items: true,
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
        transportSaved:
          !!purchase.transporterName &&
          !!purchase.mobileNumber &&
          !!purchase.vehicleNumber,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase",
    });
  }
};
export const deletePurchase = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete purchase",
    });
  }
};
export const getPurchaseBillNo = async (req: Request, res: Response) => {
  try {
    const billNo = await generateBillNo("PURCHASE", "purchase");

    return res.status(200).json({
      success: true,
      billNo,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate bill no",
    });
  }
};
export const submitPurchaseItemInward = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const {
      vehicleSrNo,
      mfgDate,
      keyNo,
      batteryMake,
      batteryNo,
      first1TyerNo,
      first2TyerNo,
      second1TyerNo,
      second2TyerNo,
      location,
      grnNumber,
      grnDate,
      grnRecordDate,
    } = req.body;

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
        grnRecordDate: grnRecordDate
          ? new Date(grnRecordDate)
          : null,
        status: "Inward",
      },
    });

    res.json({
      success: true,
      data: item,
      message: "Inward saved successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Failed",
    });
  }
};
export const getVehicleSerialNo = async (
  req: Request,
  res: Response
) => {
  try {
    const vehicleSrNo = await generateVehicleSerialNo();

    return res.json({
      success: true,
      vehicleSrNo,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Failed to generate Vehicle Serial No.",
    });
  }
};
export const saveTransport = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const {
      transporterName,
      mobileNumber,
      vehicleNumber,
    } = req.body;

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
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to save transport details",
    });
  }
};
export const getTransport = async (
  req: Request,
  res: Response
) => {
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
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
    });
  }
};
export const getTractorInventory = async (
  req: Request,
  res: Response
) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: {
        status: "VERIFY",
      },
     include: {
  account: true,
  items: true,
},
      orderBy: {
        id: "desc",
      },
    });

    const data = purchases.flatMap((purchase) =>
      purchase.items.map((item) => ({
        id: item.id,

        stock: "On",
       status:
  item.status === "Inward"
    ? "Present"
    : "In Transit",

       location: purchase.purchaseLocation || "",
currentLocation:  purchase.purchaseLocation || "",

        billNo: purchase.billNo,
        purchaseBillNo: purchase.purchaseBillNo,

        supplierName:
          purchase.account?.accountName || "",

        itemName: item.itemName,
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
      }))
    );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed",
    });
  }
};