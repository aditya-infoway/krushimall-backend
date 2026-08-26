import { Router } from "express";

import {
  getVendorOrders,
  updateVendorOrderStatus,
} from "../../controllers/vendor-panel/vendorOrder.js";

import { verifyVendorToken } from "../../middleware/verifyVendorToken.js";

const router = Router();

router.get(
  "/",
  verifyVendorToken,
  getVendorOrders,
);

router.patch(
  "/:orderNumber/status",
  verifyVendorToken,
  updateVendorOrderStatus,
);

export default router;