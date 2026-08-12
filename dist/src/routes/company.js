import { Router } from "express";
import { createCompany, getCompanies, updateCompany } from "../controllers/company.js";
import { upload } from "../middleware/upload.js";
import { verifyToken } from "../middleware/middleware.js";
const router = Router();
router.post("/", verifyToken, upload.single("logo"), createCompany);
router.get("/", getCompanies);
router.put("/:id", verifyToken, upload.single("logo"), updateCompany);
export default router;
//# sourceMappingURL=company.js.map