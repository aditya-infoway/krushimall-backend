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