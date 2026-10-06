import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import * as WebsiteVariantController from "../websiteVariant.js";

// Prisma namespace import ki jagah type seedha prisma instance se nikala hai
type WebsiteVariantWhere = NonNullable<
  NonNullable<Parameters<typeof prisma.websiteVariant.findMany>[0]>["where"]
>;

// ---------------------------------------------------------------
// CONFIG: apne schema ke hisaab se check kar lena
// ---------------------------------------------------------------
// Super admin ke variants me createdType ki value
const ADMIN_CREATED_TYPE = "ADMIN";

// Vendor admin ke variants me createdType ki value (webVendor "VENDOR" use karta hai)
const VENDOR_ADMIN_CREATED_TYPE = "VENDOR_ADMIN";

// Selectable list me sirf poore bane (submit hue) variants dikhenge, DRAFT nahi
const ACTIVE_FILTER: WebsiteVariantWhere = { isCompleted: true };

const VARIANT_INCLUDE = {
  category: true,
  brand: true,
  model: true,
  variant: true,
  modelYear: true,
};

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
type VendorAuth = { vendorId: number; email: string; name?: string };

const getVendorAuth = (req: Request) =>
  (req as any).vendor as VendorAuth | undefined;

const unauthorized = (res: Response) =>
  res.status(401).json({ success: false, message: "Authentication required" });

const notFound = (res: Response) =>
  res
    .status(404)
    .json({ success: false, message: "Website Variant not found" });

// Ye vendor admin ke apne bane hue variants ka common filter
// (middleware me vendorId = VendorAdmin table ka id hota hai)
const ownedWhere = (vendorAdminId: number): WebsiteVariantWhere => ({
  vendorAdminId,
});

// Body se ownership wale fields hata do, taaki client inhe badal na sake
const stripOwnershipFields = (body: Record<string, any>) => {
  delete body.vendorId;
  delete body.vendorAdminId;
  delete body.createdById;
  delete body.createdBy;
  delete body.createdType;
};

// ---------------------------------------------------------------
// Create (manual)
// ---------------------------------------------------------------
export const createWebsiteVariant = async (req: Request, res: Response) => {
  try {
    const vendorAuth = getVendorAuth(req);
    if (!vendorAuth) return unauthorized(res);

    stripOwnershipFields(req.body);

    // vendorId set nahi karna: wo WebVendor table ka id hai, VendorAdmin ka nahi
    req.body.vendorAdminId = vendorAuth.vendorId;
    req.body.createdType = VENDOR_ADMIN_CREATED_TYPE;
    req.body.createdById = vendorAuth.vendorId;
    req.body.createdBy = vendorAuth.name ?? vendorAuth.email;

    return WebsiteVariantController.createWebsiteVariant(req, res);
  } catch (error) {
    console.error("VendorAdmin Create Website Variant:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create Website Variant" });
  }
};

// ---------------------------------------------------------------
// List: vendor admin ke apne variants
// ---------------------------------------------------------------
export const getWebsiteVariants = async (req: Request, res: Response) => {
  try {
    const vendorAuth = getVendorAuth(req);
    if (!vendorAuth) return unauthorized(res);

    const variants = await prisma.websiteVariant.findMany({
      where: ownedWhere(vendorAuth.vendorId),
      include: VARIANT_INCLUDE,
      orderBy: { id: "desc" },
    });

    return res.status(200).json({ success: true, data: variants });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch Website Variants" });
  }
};

// ---------------------------------------------------------------
// Selectable list: Add Product ke "Select Variant" dropdown ke liye
// GET /selectable?source=admin|mine|all&search=&page=1&limit=20
//   admin = super admin ne banaye
//   mine  = is vendor admin ne khud banaye
//   all   = dono (default)
// ---------------------------------------------------------------
// Auto mode dropdown ke liye: sirf is vendor admin ke apne, completed variants
export const getSelectableWebsiteVariants = async (
  req: Request,
  res: Response,
) => {
  try {
    const vendorAuth = getVendorAuth(req);
    if (!vendorAuth) return unauthorized(res);

    const variants = await prisma.websiteVariant.findMany({
      where: { AND: [ownedWhere(vendorAuth.vendorId), ACTIVE_FILTER] },
      include: VARIANT_INCLUDE,
      orderBy: { id: "desc" },
    });

    return res.status(200).json({ success: true, data: variants });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch selectable Website Variants",
    });
  }
};
// ---------------------------------------------------------------
// Selectable variant ki poori detail (form auto-fill ke liye)
// Access: super admin wala ya apna khud ka
// ---------------------------------------------------------------
// export const getSelectableWebsiteVariantById = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const vendorAuth = getVendorAuth(req);
//     if (!vendorAuth) return unauthorized(res);

//     const variant = await prisma.websiteVariant.findFirst({
//       where: {
//         id: Number(req.params.id),
//         OR: [
//           { createdType: ADMIN_CREATED_TYPE },
//           ownedWhere(vendorAuth.vendorId),
//         ],
//       },
//       include: VARIANT_INCLUDE,
//     });

//     if (!variant) return notFound(res);

//     return res.status(200).json({ success: true, data: variant });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Failed to fetch Website Variant" });
//   }
// };

// ---------------------------------------------------------------
// Get by id (sirf apna)
// ---------------------------------------------------------------
export const getWebsiteVariantById = async (req: Request, res: Response) => {
  try {
    const vendorAuth = getVendorAuth(req);
    if (!vendorAuth) return unauthorized(res);

    const variant = await prisma.websiteVariant.findFirst({
      where: {
        id: Number(req.params.id),
        ...ownedWhere(vendorAuth.vendorId),
      },
      include: VARIANT_INCLUDE,
    });

    if (!variant) return notFound(res);

    return res.status(200).json({ success: true, data: variant });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch Website Variant" });
  }
};

// ---------------------------------------------------------------
// Update / Save Step / Submit / Delete (sirf apna variant)
// ---------------------------------------------------------------
const ownedAction =
  (
    action: (req: Request, res: Response) => unknown,
    errorMessage: string,
    stripBody = false,
  ) =>
  async (req: Request, res: Response) => {
    try {
      const vendorAuth = getVendorAuth(req);
      if (!vendorAuth) return unauthorized(res);

      const owned = await prisma.websiteVariant.findFirst({
        where: {
          id: Number(req.params.id),
          ...ownedWhere(vendorAuth.vendorId),
        },
        select: { id: true },
      });
      if (!owned) return notFound(res);

      if (stripBody && req.body) stripOwnershipFields(req.body);

      return action(req, res);
    } catch (error) {
      console.error(errorMessage, error);
      return res.status(500).json({ success: false, message: errorMessage });
    }
  };

export const updateWebsiteVariant = ownedAction(
  WebsiteVariantController.updateWebsiteVariant,
  "Failed to update Website Variant",
  true,
);

export const saveStep = ownedAction(
  WebsiteVariantController.saveStep,
  "Failed to save step",
  true,
);

export const submitWebsiteVariant = ownedAction(
  WebsiteVariantController.submitWebsiteVariant,
  "Failed to submit Website Variant",
);

export const deleteWebsiteVariant = ownedAction(
  WebsiteVariantController.deleteWebsiteVariant,
  "Failed to delete Website Variant",
);
export const toggleWebsiteVariantStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.websiteVariant.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Website Variant not found",
      });
    }

    const newStatus = existing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const updated = await prisma.websiteVariant.update({
      where: { id },
      data: {
        status: newStatus,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Status changed to ${newStatus}`,
      data: updated,
    });
  } catch (error) {
    console.error("Toggle Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};

type FieldType =
  | "string"
  | "slug"
  | "upper"
  | "yesno"
  | "int"
  | "float"
  | "bool"
  | "date"
  | "array";

type FieldConfig = { type: FieldType; aliases?: string[] };

// "Ex-Showroom Price" -> "exshowroomprice"
const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const isEmpty = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s === "" || /^(not specified|n\/?a|na|none|null|-+)$/i.test(s);
};

// slug  = lowercase + spaces -> "_"  (e.g. "In Stock" -> "in_stock", "2WD" -> "2wd")
// yesno = "Yes"/"No" -> "yes"/"no"   (same values as the frontend radio buttons)
const FIELD_MAP: Record<string, FieldConfig> = {
  // ---------- Basic Info ----------
  variantCode: { type: "string", aliases: ["Variant Code"] },
  productName: {
    type: "string",
    aliases: ["Product Name", "Website Display Product Name"],
  },
  productCode: { type: "string", aliases: ["Product Code"] },
  skuCode: { type: "string", aliases: ["SKU Code", "SKU"] },
  launchYear: { type: "date", aliases: ["Launch Year", "Launch Date"] },
  country: { type: "string", aliases: ["Country"] },
  tractorStatus: { type: "slug", aliases: ["Tractor Status"] },
  driveType: { type: "slug", aliases: ["Drive Type"] },
  shortDescription: { type: "string", aliases: ["Short Description"] },
  highlight1: { type: "string", aliases: ["Highlight 1"] },
  highlight2: { type: "string", aliases: ["Highlight 2"] },
  highlight3: { type: "string", aliases: ["Highlight 3"] },
  highlight4: { type: "string", aliases: ["Highlight 4"] },
  highlight5: { type: "string", aliases: ["Highlight 5"] },
  redColor: { type: "bool", aliases: ["Red"] },
  blueColor: { type: "bool", aliases: ["Blue"] },
  greenColor: { type: "bool", aliases: ["Green"] },
  orangeColor: { type: "bool", aliases: ["Orange"] },
  blackColor: { type: "bool", aliases: ["Black"] },
  whiteColor: { type: "bool", aliases: ["White"] },
  customColor: { type: "bool", aliases: ["Custom Color"] },
  customColorName: { type: "string", aliases: ["Custom Color Name"] },
  customColorCode: { type: "string", aliases: ["Custom Color Code"] },
  availableStates: { type: "array", aliases: ["Available States"] },
  availableDistricts: { type: "array", aliases: ["Available Districts"] },
  availableDealers: { type: "array", aliases: ["Available Dealers"] },
  stockStatus: { type: "slug", aliases: ["Stock Status"] },
  seoTitle: { type: "string", aliases: ["SEO Title"] },
  seoUrl: { type: "string", aliases: ["SEO URL"] },
  metaDescription: { type: "string", aliases: ["Meta Description"] },
  keywords: { type: "string", aliases: ["Keywords"] },
  isUpcoming: { type: "bool", aliases: ["Upcoming", "Is Upcoming"] },

  // ---------- Engine ----------
  engineType: { type: "slug", aliases: ["Engine Type"] },
  fuelType: { type: "slug", aliases: ["Fuel Type"] },
  horsePower: { type: "int", aliases: ["Horse Power", "HP", "Engine HP"] },
  numberOfCylinders: {
    type: "string",
    aliases: ["Number of Cylinders", "Cylinders"],
  },
  cubicCapacity: { type: "int", aliases: ["Cubic Capacity", "CC"] },
  ratedRpm: { type: "int", aliases: ["Rated RPM"] },
  aspiratedType: { type: "slug", aliases: ["Aspirated Type"] },
  emissionNorms: { type: "slug", aliases: ["Emission Norms"] },
  coolingSystem: { type: "slug", aliases: ["Cooling System"] },
  airFilterType: { type: "slug", aliases: ["Air Filter Type", "Air Filter"] },
  maximumTorque: { type: "float", aliases: ["Maximum Torque", "Max Torque"] },
  torqueRpm: { type: "float", aliases: ["Torque RPM"] },
  torqueBackup: { type: "float", aliases: ["Torque Backup"] },
  engineCondition: { type: "slug", aliases: ["Engine Condition"] },

  // ---------- Transmission ----------
  clutchType: { type: "slug", aliases: ["Clutch Type", "Clutch"] },
  forwardGears: { type: "int", aliases: ["Forward Gears"] },
  reverseGears: { type: "int", aliases: ["Reverse Gears"] },
  gearType: { type: "slug", aliases: ["Gear Type"] },
  transmissionType: { type: "slug", aliases: ["Transmission Type"] },
  ptoHp: { type: "int", aliases: ["PTO HP"] },
  ptoRpm: { type: "int", aliases: ["PTO RPM"] },
  ptoType: { type: "slug", aliases: ["PTO Type"] },
  ptoPosition: { type: "slug", aliases: ["PTO Position"] },
  creeperGears: { type: "bool", aliases: ["Creeper Gears"] },
  shuttleShift: { type: "bool", aliases: ["Shuttle Shift"] },
  sideShiftGear: { type: "bool", aliases: ["Side Shift Gear"] },
  powerShuttle: { type: "bool", aliases: ["Power Shuttle"] },
  hiLoGears: { type: "bool", aliases: ["Hi Lo Gears", "Hi-Lo Gears"] },
  multiSpeedPto: { type: "bool", aliases: ["Multi Speed PTO"] },
  reversePto: { type: "bool", aliases: ["Reverse PTO"] },
  superReducer: { type: "bool", aliases: ["Super Reducer"] },

  // ---------- Hydraulic ----------
  liftingCapacity: { type: "int", aliases: ["Lifting Capacity"] },
  liftingCapacityAt610mm: {
    type: "int",
    aliases: ["Lifting Capacity At 610mm", "Lifting Capacity 610mm"],
  },
  hydraulicType: { type: "slug", aliases: ["Hydraulic Type"] },
  addc: { type: "bool", aliases: ["ADDC"] },
  positionControl: { type: "bool", aliases: ["Position Control"] },
  draftControl: { type: "bool", aliases: ["Draft Control"] },
  controlType: { type: "slug", aliases: ["Control Type"] },
  remoteValveType: { type: "slug", aliases: ["Remote Valve Type"] },
  numberOfRemoteValves: {
    type: "string",
    aliases: ["Number of Remote Valves", "Remote Valves"],
  },
  threePointLinkage: {
    type: "slug",
    aliases: ["Three Point Linkage", "3 Point Linkage"],
  },
  linkageCategory: { type: "slug", aliases: ["Linkage Category"] },
  topLink: { type: "slug", aliases: ["Top Link"] },
  draftSensitivity: { type: "slug", aliases: ["Draft Sensitivity"] },
  externalHydraulicCylinder: {
    type: "bool",
    aliases: ["External Hydraulic Cylinder"],
  },
  selfLevelling: { type: "bool", aliases: ["Self Levelling", "Self Leveling"] },
  quickHitch: { type: "bool", aliases: ["Quick Hitch"] },
  downPositionControl: { type: "bool", aliases: ["Down Position Control"] },
  loadSensing: { type: "bool", aliases: ["Load Sensing"] },
  flowControl: { type: "bool", aliases: ["Flow Control"] },
  returnToDepth: { type: "bool", aliases: ["Return To Depth"] },
  transportLock: { type: "bool", aliases: ["Transport Lock"] },

  // ---------- Pricing ----------
  exShowroomPrice: {
    type: "float",
    aliases: ["Ex-Showroom Price", "Ex Showroom Price"],
  },
  onRoadPrice: { type: "float", aliases: ["On-Road Price", "On Road Price"] },
  currency: { type: "upper", aliases: ["Currency"] },
  gst: { type: "float", aliases: ["GST (%)", "GST"] },
  tcsApplicable: { type: "yesno", aliases: ["TCS Applicable"] },
  tcsPercentage: { type: "float", aliases: ["TCS (%)", "TCS"] },
  financeAvailable: { type: "yesno", aliases: ["Finance Available"] },
  emiAvailable: { type: "yesno", aliases: ["EMI Available"] },
  downPayment: { type: "float", aliases: ["Down Payment"] },
  offerPrice: { type: "float", aliases: ["Offer Price"] },
  negotiable: { type: "yesno", aliases: ["Negotiable"] },
  exchangeOffer: { type: "yesno", aliases: ["Exchange Offer"] },

  // ---------- Location ----------
  state: { type: "string", aliases: ["State"] },
  district: { type: "string", aliases: ["District"] },
  taluka: { type: "string", aliases: ["Taluka"] },
  city: { type: "string", aliases: ["City"] },
  pincode: { type: "string", aliases: ["Pincode", "Pin Code"] },
  landmark: { type: "string", aliases: ["Landmark"] },
  fullAddress: { type: "string", aliases: ["Full Address", "Address"] },
  searchLocation: { type: "string", aliases: ["Search Location"] },
  latitude: { type: "float", aliases: ["Latitude", "Lat"] },
  longitude: { type: "float", aliases: ["Longitude", "Lng", "Long"] },

  // Images / documents (frontView, brochure, invoice...) are not imported,
  // because files cannot be uploaded through Excel. They are uploaded from the edit page.
};

// Excel columns resolved by name -> ID lookup (handled separately from FIELD_MAP)
const NAME_COLUMNS: Record<string, string[]> = {
  category: ["category", "categoryname"],
  brand: ["brand", "brandname"],
  model: ["model", "modelname"],
  modelYear: ["modelyear"],
  variant: ["variant", "variantname"],
};
const NAME_HEADER_SET = new Set(Object.values(NAME_COLUMNS).flat());

// Direct ID columns are also allowed
const ID_COLUMNS: Record<string, string> = {
  categoryid: "categoryId",
  brandid: "brandId",
  modelid: "modelId",
  modelyearid: "modelYearId",
  variantid: "variantId",
};

// normalized header -> field name
const HEADER_LOOKUP: Record<string, string> = {};
Object.entries(FIELD_MAP).forEach(([field, cfg]) => {
  HEADER_LOOKUP[norm(field)] = field;
  (cfg.aliases || []).forEach((a) => {
    HEADER_LOOKUP[norm(a)] = field;
  });
});

const convertValue = (value: unknown, type: FieldType): any => {
  switch (type) {
    case "int": {
      const n = parseInt(String(value).replace(/,/g, ""), 10);
      if (Number.isNaN(n)) throw new Error(`"${value}" is not a valid number`);
      return n;
    }
    case "float": {
      const n = parseFloat(String(value).replace(/,/g, ""));
      if (Number.isNaN(n)) throw new Error(`"${value}" is not a valid number`);
      return n;
    }
    case "bool":
      return ["yes", "y", "true", "1"].includes(
        String(value).trim().toLowerCase(),
      );
    case "yesno": {
      const v = String(value).trim().toLowerCase();
      if (["yes", "y", "true", "1"].includes(v)) return "yes";
      if (["no", "n", "false", "0"].includes(v)) return "no";
      throw new Error(`"${value}" must be Yes or No`);
    }
    case "slug":
      return String(value)
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");
    case "upper":
      return String(value).trim().toUpperCase();
    case "date": {
      const raw = String(value).trim();

      let d: Date;
      if (typeof value === "number") {
        // sirf year (jaise 2024) ya Excel serial number
        d =
          value >= 1900 && value <= 2100
            ? new Date(Date.UTC(value, 0, 1))
            : new Date(Math.round((value - 25569) * 86400 * 1000));
      } else if (/^\d{4}$/.test(raw)) {
        d = new Date(Date.UTC(Number(raw), 0, 1));
      } else {
        d = new Date(raw);
      }

      if (Number.isNaN(d.getTime()))
        throw new Error(`"${value}" is not a valid date`);
      return d.toISOString();
    }
    case "array":
      return String(value)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    default:
      return String(value).trim();
  }
};

// Finds a record by name (ignores case, spaces and symbols).
// On failure, the error lists the names that are available at that level.
const resolveByName = (
  pool: any[],
  field: string,
  value: string,
  label: string,
) => {
  const found = pool.find((x) => norm(x[field]) === norm(value));
  if (!found) {
    const available = pool
      .slice(0, 15)
      .map((x) => x[field])
      .join(", ");
    throw new Error(
      `${label} "${value}" not found. Available: ${available || "none"}${
        pool.length > 15 ? ", ..." : ""
      }`,
    );
  }
  return found;
};

// Import (Excel rows are sent as JSON)
// Import (Excel rows are sent as JSON)
export const importWebsiteVariants = async (req: Request, res: Response) => {
  try {
    const vendorAuth = getVendorAuth(req);
    if (!vendorAuth) return unauthorized(res);

    const rows = req.body?.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data found in the Excel file",
      });
    }
    if (rows.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "You can import a maximum of 1000 rows at a time",
      });
    }

    const [categories, brands, models, modelYears, variants]: any[][] =
      await Promise.all([
        prisma.category.findMany(),
        prisma.brand.findMany(),
        prisma.model.findMany(),
        prisma.modelYear.findMany(),
        prisma.variant.findMany(),
      ]);

    const ignoredColumns = new Set<string>();
    const errors: { row: number; message: string }[] = [];
    let created = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowNo = i + 2;
      try {
        const data: Record<string, any> = {};
        const names: Record<string, string> = {};

        for (const [header, value] of Object.entries(rows[i] || {})) {
          const key = norm(header);

          if (NAME_HEADER_SET.has(key)) {
            if (!isEmpty(value)) {
              const slot = Object.keys(NAME_COLUMNS).find((k) =>
                NAME_COLUMNS[k].includes(key),
              );
              if (slot) names[slot] = String(value).trim();
            }
            continue;
          }

          if (ID_COLUMNS[key]) {
            if (!isEmpty(value))
              data[ID_COLUMNS[key]] = convertValue(value, "int");
            continue;
          }

          const field = HEADER_LOOKUP[key];
          if (!field) {
            ignoredColumns.add(header);
            continue;
          }
          if (isEmpty(value)) continue;
          data[field] = convertValue(value, FIELD_MAP[field].type);
        }

        // required checks (resolve se pehle)
        if (!data.productName) throw new Error("Product Name is required");
        if (!data.categoryId && !names.category)
          throw new Error("Category is required");
        if (!data.brandId && !names.brand) throw new Error("Brand is required");
        if (!data.modelId && !names.model) throw new Error("Model is required");
        if (!data.modelYearId && !names.modelYear)
          throw new Error("Model Year is required");
        if (!data.variantId && !names.variant)
          throw new Error("Variant is required");

        // ---- Resolve IDs from names ----
        if (names.category && !data.categoryId) {
          data.categoryId = resolveByName(
            categories,
            "categoryName",
            names.category,
            "Category",
          ).id;
        }
        if (names.brand && !data.brandId) {
          const pool = brands.filter(
            (x) => !data.categoryId || x.categoryId === data.categoryId,
          );
          data.brandId = resolveByName(
            pool,
            "brandName",
            names.brand,
            "Brand",
          ).id;
        }
        if (names.model && !data.modelId) {
          const pool = models.filter(
            (x) => !data.brandId || x.brandId === data.brandId,
          );
          data.modelId = resolveByName(
            pool,
            "modelName",
            names.model,
            "Model",
          ).id;
        }
        if (names.modelYear && !data.modelYearId) {
          const pool = modelYears.filter(
            (x) => !data.modelId || x.modelId === data.modelId,
          );
          data.modelYearId = resolveByName(
            pool,
            "modelYear",
            names.modelYear,
            "Model Year",
          ).id;
        }
        if (names.variant && !data.variantId) {
          const pool = variants.filter(
            (x) => !data.modelYearId || x.modelYearId === data.modelYearId,
          );
          const v = resolveByName(
            pool,
            "variantName",
            names.variant,
            "Variant",
          );
          data.variantId = v.id;
          if (!data.variantCode && v.variantCode)
            data.variantCode = v.variantCode;
        }
        const LAST_STEP = 5;
        await prisma.websiteVariant.create({
          data: {
            ...data,
            // vendorId set nahi karna (WebVendor ka id hai), admin create jaisa hi
            vendorAdminId: vendorAuth.vendorId,
            createdById: vendorAuth.vendorId,
            createdBy: vendorAuth.name ?? vendorAuth.email,
            createdType: VENDOR_ADMIN_CREATED_TYPE,
            entryMode: "MANUAL",
            isCompleted: true, // draft nahi, complete record
            status: "ACTIVE", // list mein toggle ON dikhega
            currentStep: LAST_STEP,
          } as any,
        });
        created++;
      } catch (err: any) {
        errors.push({
          row: rowNo,
          message: err?.message || "Failed to save row",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${created} products imported, ${errors.length} failed`,
      data: {
        created,
        failed: errors.length,
        errors,
        ignoredColumns: [...ignoredColumns],
      },
    });
  } catch (error) {
    console.error("VendorAdmin Import Website Variants:", error);
    return res.status(500).json({ success: false, message: "Import failed" });
  }
};

// Template dropdowns ke liye: DB se Category > Brand > Model > Model Year > Variant
export const getImportOptions = async (_req: Request, res: Response) => {
  try {
    const [categories, brands, models, modelYears, variants]: any[][] =
      await Promise.all([
        prisma.category.findMany(),
        prisma.brand.findMany(),
        prisma.model.findMany(),
        prisma.modelYear.findMany(),
        prisma.variant.findMany(),
      ]);

    const catById = new Map(categories.map((x) => [x.id, x.categoryName]));
    const brandById = new Map(brands.map((x) => [x.id, x.brandName]));
    const modelById = new Map(models.map((x) => [x.id, x.modelName]));
    const yearById = new Map(
      modelYears.map((x) => [x.id, String(x.modelYear)]),
    );

    // har pair = [parent name, child name]
    const pairs = (
      list: any[],
      parentMap: Map<any, string>,
      parentKey: string,
      childKey: string,
    ) =>
      list
        .filter((x) => parentMap.has(x[parentKey]) && x[childKey] != null)
        .map((x) => [
          parentMap.get(x[parentKey]) as string,
          String(x[childKey]),
        ]);

    return res.status(200).json({
      success: true,
      data: {
        categories: categories.map((x) => x.categoryName),
        brands: pairs(brands, catById, "categoryId", "brandName"),
        models: pairs(models, brandById, "brandId", "modelName"),
        modelYears: pairs(modelYears, modelById, "modelId", "modelYear"),
        variants: pairs(variants, yearById, "modelYearId", "variantName"),
      },
    });
  } catch (error) {
    console.error("Import options:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load options" });
  }
};
