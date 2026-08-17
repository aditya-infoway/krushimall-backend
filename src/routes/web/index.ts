import { Router } from "express";

import brandRoutes from "./brand.js";
import categoryRoutes from "./category.js";
import colourRoutes from "./colour.js";
import modelRoutes from "./model.js";
import modelYearRoutes from "./modelyear.js";
import showroomVariantRoutes from "./showroomVariant.js";
import variantRoutes from "./variant.js";

const router = Router();

router.use("/brands", brandRoutes);
router.use("/categories", categoryRoutes);
router.use("/colours", colourRoutes);
router.use("/models", modelRoutes);
router.use("/model-years", modelYearRoutes);
router.use("/showroom-variants", showroomVariantRoutes);
router.use("/variants", variantRoutes);

export default router;