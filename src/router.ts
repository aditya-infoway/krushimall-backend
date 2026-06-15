import { Router } from "express";
import authRoutes from "./routes/auth.js";
import companyRoute from "./routes/company.js";
import categoryRoutes from "./routes/category.js";
import brandRoutes from "./routes/brand.js";
import modelRoutes from "./routes/model.js";
import modelYearRoutes from "./routes/modelYear.js";
const router = Router();

router.use("/auth", authRoutes);
router.use("/company", companyRoute);
router.use("/category", categoryRoutes);
router.use("/brand", brandRoutes);
router.use("/model", modelRoutes);
router.use("/model-year", modelYearRoutes);
export default router;
