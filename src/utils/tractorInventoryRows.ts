import prisma from "../lib/prisma.js";

export type InventoryStatus = "Transit" | "Present" | "Booked";

const norm = (v: any) => String(v ?? "").trim().toLowerCase();

// PurchaseItem.status => frontend status
// Booked  => Booked  (order mein allot ho chuka)
// Inward  => Present (inward submit ho chuka)
// baaki   => Transit (purchase hui, inward abhi nahi hua)
export const getInventoryStatus = (itemStatus: any): InventoryStatus => {
  const s = norm(itemStatus);
  if (s === "booked") return "Booked";
  if (s === "inward") return "Present";
  return "Transit";
};

type InventoryOptions = {
  // Admin / Employee: ?branchId=X dene par sirf us branch ko transfer hui vehicles
  branchId?: number | null;

  // "all"       => sab vehicles (branchId diya ho to us branch tak filter)
  // "forBranch" => branch panel: jo kisi ko transfer nahi hui + jo is branch ko transfer hui
  mode?: "all" | "forBranch";
};

export const getTractorInventoryRows = async (
  options: InventoryOptions = {},
) => {
  const { branchId = null, mode = "all" } = options;

  // ======================================================
  // Stock transfer sirf branch/location batane ke liye (status ke liye NAHI)
  // chassis -> latest transfer
  // ======================================================
  const transfers = await prisma.vehicleStockTransfer.findMany({
    include: {
      branch: {
        select: {
          id: true,
          branchCode: true,
          branchName: true,
        },
      },
    },
    orderBy: { id: "desc" },
  });

  const transferByChassis = new Map<string, any>();
  for (const t of transfers as any[]) {
    const key = norm(t.chassisNo);
    if (key && !transferByChassis.has(key)) {
      transferByChassis.set(key, t);
    }
  }

  // ======================================================
  // Purchase items = inventory ka single source of truth
  // ======================================================
  const purchaseItems = await prisma.purchaseItem.findMany({
    include: {
      purchase: {
        select: {
          billNo: true,
          purchaseBillNo: true,
          purchaseLocation: true,
          account: { select: { accountName: true } },
        },
      },
    },
    orderBy: { id: "desc" },
  });

  const rows = purchaseItems
    .map((item: any) => {
      const transfer = transferByChassis.get(norm(item.chassisNo)) ?? null;
      return { item, transfer };
    })
    .filter(({ transfer }) => {
      const transferBranchId = transfer?.branch?.id ?? transfer?.branchId ?? null;

      if (mode === "forBranch") {
        // Transfer nahi hui => sab branch dekh sakti hain
        // Transfer hui => sirf usi branch ko
        return !transfer || Number(transferBranchId) === Number(branchId);
      }

      // mode "all": branchId diya ho to sirf us branch ko transfer hui vehicles
      if (branchId) {
        return !!transfer && Number(transferBranchId) === Number(branchId);
      }

      return true;
    })
    .map(({ item, transfer }) => {
      const branchName =
        transfer?.branch?.branchName ?? item.purchase?.purchaseLocation ?? "";

      return {
        id: `P-${item.id}`,
        source: "PURCHASE",
        stock: "On",
        status: getInventoryStatus(item.status),

        branchId: transfer?.branch?.id ?? transfer?.branchId ?? null,
        branchName: transfer?.branch?.branchName ?? "",
        location: item.location ?? item.purchase?.purchaseLocation ?? "",
        currentLocation: branchName,

        billNo: item.purchase?.billNo ?? "",
        purchaseBillNo: item.purchase?.purchaseBillNo ?? "",
        supplierName: item.purchase?.account?.accountName ?? "",

        itemName: item.itemName ?? "",
        itemCode: item.itemCode ?? "",
        modelName: item.modelName ?? "",
        variantName: item.variantName ?? "",
        colour: item.color ?? "",
        fuelType: item.fuelType ?? "",

        serialNo: item.vehicleSrNo ?? "",
        mfgDate: item.mfgDate ?? null,
        chassisNo: item.chassisNo ?? "",
        engineNo: item.engineNo ?? "",
        keyNumber: item.keyNo ?? "",

        batteryMake: item.batteryMake ?? "",
        batteryNo: item.batteryNo ?? "",

        first1TyreNo: item.first1TyerNo ?? "",
        first2TyreNo: item.first2TyerNo ?? "",
        second1TyreNo: item.second1TyerNo ?? "",
        second2TyreNo: item.second2TyerNo ?? "",

        grnDate: item.grnDate ?? null,
        grnRecordDate: item.grnRecordDate ?? null,
        grnNo: item.grnNumber ?? "",

        // Inward hua hi nahi to date/time khali
        inWardDate: item.grnRecordDate ?? null,
        inWardTime: item.grnRecordDate ? (item.updatedAt ?? null) : null,
      };
    });

  return rows;
};