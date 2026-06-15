import { Router } from "express";
import {
  createCompany,
  getCompanies,
  updateCompany
} from "../controllers/company.js";

import { upload } from "../middleware/upload.js";

const router = Router();

router.post(
  "/",
  upload.single("logo"),
  createCompany
);

router.get("/", getCompanies);
router.put(
  "/:id",
  upload.single("logo"),
  updateCompany
);
export default router;